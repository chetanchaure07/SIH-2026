// ============================================================
// Weather Controller
// GET  /api/weather/current  — latest weather row from DB,
//                              or fetches from Open-Meteo and stores it
// GET  /api/weather/history  — last N hours of weather data
// POST /api/weather/readings — insert a manual/sensor weather reading
// ============================================================

import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
// Antarctica research station coordinates (Queen Maud Land)
const LAT = -71.0;
const LON = 11.3;

// WMO weather code → internal code
function wmoToCode(wmo: number): string {
  if (wmo === 0) return 'CLEAR';
  if (wmo <= 2)  return 'PARTLY_CLOUDY';
  if (wmo === 3) return 'OVERCAST';
  if (wmo <= 49) return 'FOGGY';
  if (wmo <= 59) return 'DRIZZLE';
  if (wmo <= 69) return 'RAIN';
  if (wmo <= 79) return 'SNOW';
  if (wmo <= 84) return 'RAIN_SHOWER';
  if (wmo <= 89) return 'SNOW_SHOWER';
  if (wmo <= 99) return 'THUNDERSTORM';
  return 'UNKNOWN';
}

// Try to fetch fresh weather from Open-Meteo, store in DB, return row
async function fetchAndStoreWeather(): Promise<Record<string, unknown> | null> {
  try {
    const params = new URLSearchParams({
      latitude:       LAT.toString(),
      longitude:      LON.toString(),
      current:        ['temperature_2m', 'wind_speed_10m', 'cloud_cover', 'relative_humidity_2m', 'surface_pressure', 'weather_code', 'shortwave_radiation'].join(','),
      hourly:         'shortwave_radiation',
      forecast_hours: '1',
      wind_speed_unit: 'ms',
      timezone:       'UTC',
    });

    const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`, {
      signal: AbortSignal.timeout(8000), // 8s timeout for offline scenarios
    });

    if (!response.ok) {
      console.warn(`[weatherController] Open-Meteo returned ${response.status}`);
      return null;
    }

    const data = await response.json() as Record<string, unknown>;
    const c = data.current as Record<string, unknown> ?? {};
    const irradiance: number = ((data.hourly as Record<string, unknown>)?.shortwave_radiation as number[])?.[0] ?? 0;

    const temperature   = (c.temperature_2m  as number) ?? -20;
    const windSpeed     = (c.wind_speed_10m  as number) ?? 0;
    const cloudCover    = (c.cloud_cover     as number) ?? 50;
    const humidity      = (c.relative_humidity_2m as number) ?? 70;
    const pressure      = (c.surface_pressure as number) ?? 980;
    const weatherCode   = wmoToCode((c.weather_code as number) ?? 0);

    const result = await pool.query(
      `INSERT INTO weather_data
         (temperature, wind_speed, solar_irradiance, cloud_cover, humidity, pressure_hpa, weather_code, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open-meteo')
       RETURNING *`,
      [temperature, windSpeed, irradiance, cloudCover, humidity, pressure, weatherCode],
    );

    console.log('[weatherController] Fetched and stored fresh weather from Open-Meteo.');
    return result.rows[0];
  } catch (err) {
    console.warn('[weatherController] Open-Meteo fetch failed (offline?):', (err as Error).message);
    return null;
  }
}

// Build the WeatherData response object from a DB row
function buildWeatherResponse(row: Record<string, unknown>): Record<string, unknown> {
  const tempC: number    = parseFloat(row.temperature as string);
  const windMs: number   = parseFloat(row.wind_speed as string);
  const cloudPct: number = parseFloat(row.cloud_cover as string);

  // Energy impact calculations (mirrors weatherApi.ts logic)
  const heatingLoadIncreaseMW   = parseFloat((Math.max(0, (-10 - tempC) * 0.025)).toFixed(2));
  const solarGenerationImpactPct = -Math.round(cloudPct * 0.8);
  const windGenerationImpactPct  = Math.min(40, Math.round((windMs / 20) * 40));

  let overallRiskLevel: string;
  if (windMs > 20 || tempC < -35)      overallRiskLevel = 'CRITICAL';
  else if (windMs > 15 || tempC < -25) overallRiskLevel = 'WARNING';
  else if (windMs > 10 || tempC < -18) overallRiskLevel = 'WATCH';
  else                                 overallRiskLevel = 'NORMAL';

  return {
    timestamp:             row.timestamp,
    temperatureCelsius:    tempC,
    feelsLikeCelsius:      tempC - 5,   // Simplified — full calc needs wind chill formula
    windSpeedMs:           windMs,
    windGustMs:            windMs * 1.5,
    windDirectionDeg:      247,          // Not stored per-row yet
    precipitationMmh:      0,
    snowfallCmh:           0,
    visibilityKm:          8.0,
    pressureHpa:           parseFloat((row.pressure_hpa as string) ?? '980'),
    humidityPercent:       parseFloat((row.humidity as string) ?? '70'),
    solarIrradianceWm2:    parseFloat((row.solar_irradiance as string) ?? '0'),
    cloudCoverPercent:     cloudPct,
    uvIndex:               0,
    weatherCode:           row.weather_code,
    weatherDescription:    row.weather_code,
    policeWarningLevel:    windMs > 20 ? 3 : windMs > 15 ? 2 : windMs > 10 ? 1 : 0,
    energyImpact: {
      heatingLoadIncreaseMW,
      solarGenerationImpactPct,
      windGenerationImpactPct,
      overallRiskLevel,
      description: `${overallRiskLevel === 'NORMAL' ? 'Moderate' : overallRiskLevel} conditions. Cloud cover reducing solar by ~${Math.abs(solarGenerationImpactPct)}%. Wind ${windGenerationImpactPct > 0 ? 'boosting' : 'affecting'} generation by ${windGenerationImpactPct}%. Heating demand ${heatingLoadIncreaseMW > 0 ? `elevated (+${heatingLoadIncreaseMW.toFixed(2)} MW)` : 'nominal'} due to ${tempC.toFixed(1)}°C ambient.`,
    },
  };
}

// GET /api/weather/current
export async function getWeatherCurrentHandler(req: Request, res: Response): Promise<void> {
  try {
    // First check if we have a recent reading (< 30 minutes old)
    const recent = await pool.query(`
      SELECT * FROM weather_data
      WHERE timestamp >= NOW() - INTERVAL '30 minutes'
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    if (recent.rows.length > 0) {
      res.json(buildWeatherResponse(recent.rows[0]));
      return;
    }

    // No recent data — try to fetch fresh data from Open-Meteo
    const fresh = await fetchAndStoreWeather();
    if (fresh) {
      res.json(buildWeatherResponse(fresh));
      return;
    }

    // Open-Meteo unavailable (offline) — return most recent DB row as fallback
    const fallback = await pool.query(`
      SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT 1
    `);

    if (fallback.rows.length > 0) {
      console.warn('[weatherController] Using stale DB weather as offline fallback.');
      res.json({ ...buildWeatherResponse(fallback.rows[0]), _offline_fallback: true });
      return;
    }

    res.status(503).json({
      error: 'No weather data available. Open-Meteo is unreachable and the database has no cached weather. Run seed.sql.',
    });
  } catch (err) {
    console.error('[weatherController] getWeatherCurrent error:', err);
    res.status(500).json({ error: 'Database error fetching weather data.' });
  }
}

// GET /api/weather/history?hours=24
export async function getWeatherHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const hours = parseInt((req.query.hours as string) ?? '24', 10);
    const safeHours = Math.min(Math.max(hours, 1), 168);

    const result = await pool.query(`
      SELECT timestamp, temperature, wind_speed, solar_irradiance, cloud_cover, pressure_hpa
      FROM weather_data
      WHERE timestamp >= NOW() - ($1 || ' hours')::INTERVAL
      ORDER BY timestamp ASC
    `, [safeHours]);

    const rows = result.rows.map((row) => ({
      timestamp:          row.timestamp,
      temperatureCelsius: parseFloat(row.temperature),
      windSpeedMs:        parseFloat(row.wind_speed),
      solarIrradianceWm2: parseFloat(row.solar_irradiance),
      cloudCoverPercent:  parseFloat(row.cloud_cover),
      pressureHpa:        parseFloat(row.pressure_hpa),
    }));

    res.json(rows);
  } catch (err) {
    console.error('[weatherController] getWeatherHistory error:', err);
    res.status(500).json({ error: 'Database error fetching weather history.' });
  }
}

// POST /api/weather/readings
// For manual entry or local sensor ingest.
export async function postWeatherReadingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { temperature, wind_speed, solar_irradiance, cloud_cover, humidity, pressure_hpa, weather_code, source } = req.body as Record<string, unknown>;

    if (typeof temperature !== 'number') {
      res.status(400).json({ error: 'temperature is required and must be a number.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO weather_data (temperature, wind_speed, solar_irradiance, cloud_cover, humidity, pressure_hpa, weather_code, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, timestamp`,
      [temperature, wind_speed ?? null, solar_irradiance ?? null, cloud_cover ?? null, humidity ?? null, pressure_hpa ?? null, weather_code ?? null, source ?? 'local-sensor'],
    );

    res.status(201).json({ id: result.rows[0].id, timestamp: result.rows[0].timestamp });
  } catch (err) {
    console.error('[weatherController] postWeatherReading error:', err);
    res.status(500).json({ error: 'Database error inserting weather reading.' });
  }
}
