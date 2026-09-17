// ============================================================
// Real Weather API Service — Open-Meteo (free, no API key)
// Docs: https://open-meteo.com/en/docs
// Station: Queen Maud Land, Antarctica (approx. lat=-71.0, lon=11.3)
// ============================================================

import type { WeatherData } from '@/types';
import { subHours, format } from 'date-fns';


// Antarctica research station coordinates (Queen Maud Land area)
const LAT = -71.0;
const LON = 11.3;
const BASE_URL = 'https://api.open-meteo.com/v1';

// ---- WMO Weather Code → Our app's weatherCode & description ----
function wmoToCode(wmo: number): { code: string; description: string } {
  if (wmo === 0) return { code: 'CLEAR', description: 'Clear sky' };
  if (wmo <= 2) return { code: 'PARTLY_CLOUDY', description: 'Partly cloudy' };
  if (wmo === 3) return { code: 'OVERCAST', description: 'Overcast' };
  if (wmo <= 49) return { code: 'FOGGY', description: 'Fog' };
  if (wmo <= 59) return { code: 'DRIZZLE', description: 'Drizzle' };
  if (wmo <= 69) return { code: 'RAIN', description: 'Rain' };
  if (wmo <= 79) return { code: 'SNOW', description: 'Snow / snow showers' };
  if (wmo <= 84) return { code: 'RAIN_SHOWER', description: 'Rain showers' };
  if (wmo <= 89) return { code: 'SNOW_SHOWER', description: 'Snow showers' };
  if (wmo <= 99) return { code: 'THUNDERSTORM', description: 'Thunderstorm' };
  return { code: 'UNKNOWN', description: 'Unknown conditions' };
}

// ---- Compute energy impact from weather conditions ----
function computeEnergyImpact(
  tempC: number,
  windMs: number,
  cloudPct: number,
): WeatherData['energyImpact'] {
  // Heating load increases when temperature drops below -10°C baseline
  const heatingLoadIncreaseMW = Math.max(0, (-10 - tempC) * 0.025);

  // Solar impact: cloud cover directly reduces solar output
  const solarGenerationImpactPct = -Math.round(cloudPct * 0.8);

  // Wind impact: higher wind speeds boost wind generation (up to +40%)
  const windGenerationImpactPct = Math.min(40, Math.round((windMs / 20) * 40));

  // Overall risk assessment
  let overallRiskLevel: WeatherData['energyImpact']['overallRiskLevel'];
  if (windMs > 20 || tempC < -35) {
    overallRiskLevel = 'CRITICAL';
  } else if (windMs > 15 || tempC < -25) {
    overallRiskLevel = 'WARNING';
  } else if (windMs > 10 || tempC < -18) {
    overallRiskLevel = 'WATCH';
  } else {
    overallRiskLevel = 'NORMAL';
  }

  const description =
    `${overallRiskLevel === 'NORMAL' ? 'Moderate' : overallRiskLevel === 'WATCH' ? 'Elevated' : overallRiskLevel === 'WARNING' ? 'Adverse' : 'Severe'} conditions. ` +
    `Cloud cover reducing solar by ~${Math.abs(solarGenerationImpactPct)}%. ` +
    `Wind ${windGenerationImpactPct > 0 ? 'boosting' : 'affecting'} generation by ${windGenerationImpactPct}%. ` +
    `Heating demand ${heatingLoadIncreaseMW > 0 ? `elevated (+${heatingLoadIncreaseMW.toFixed(2)} MW)` : 'nominal'} due to ${tempC.toFixed(1)}°C ambient.`;

  return {
    heatingLoadIncreaseMW: parseFloat(heatingLoadIncreaseMW.toFixed(2)),
    solarGenerationImpactPct,
    windGenerationImpactPct,
    overallRiskLevel,
    description,
  };
}

// ---- Fetch current weather from Open-Meteo ----
export async function fetchCurrentWeather(): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: LAT.toString(),
    longitude: LON.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'precipitation',
      'snowfall',
      'visibility',
      'surface_pressure',
      'cloud_cover',
      'weather_code',
      'uv_index',
    ].join(','),
    hourly: 'shortwave_radiation',
    forecast_hours: '1',
    wind_speed_unit: 'ms',
    timezone: 'UTC',
  });

  const response = await fetch(`${BASE_URL}/forecast?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo API error: ${response.status}`);

  const data = await response.json();
  const c = data.current;
  const irradiance = data.hourly?.shortwave_radiation?.[0] ?? 0;

  const { code, description } = wmoToCode(c.weather_code ?? 0);
  const tempC: number = c.temperature_2m ?? -20;
  const windMs: number = c.wind_speed_10m ?? 0;
  const cloudPct: number = c.cloud_cover ?? 50;

  const policeWarningLevel =
    windMs > 20 ? 3 : windMs > 15 ? 2 : windMs > 10 ? 1 : 0;

  return {
    timestamp: c.time ? new Date(c.time + 'Z').toISOString() : new Date().toISOString(),
    temperatureCelsius: tempC,
    feelsLikeCelsius: c.apparent_temperature ?? tempC - 5,
    windSpeedMs: windMs,
    windGustMs: c.wind_gusts_10m ?? windMs * 1.5,
    windDirectionDeg: c.wind_direction_10m ?? 0,
    precipitationMmh: c.precipitation ?? 0,
    snowfallCmh: c.snowfall ?? 0,
    visibilityKm: Math.min(100, (c.visibility ?? 10000) / 1000),
    pressureHpa: c.surface_pressure ?? 980,
    humidityPercent: c.relative_humidity_2m ?? 70,
    solarIrradianceWm2: Math.round(irradiance),
    cloudCoverPercent: cloudPct,
    uvIndex: c.uv_index ?? 0,
    weatherCode: code,
    weatherDescription: description,
    policeWarningLevel,
    energyImpact: computeEnergyImpact(tempC, windMs, cloudPct),
  };
}

// ---- Fetch 24h weather history ----
export async function fetchWeatherHistory24h() {
  const now = new Date();
  const start = format(subHours(now, 24), 'yyyy-MM-dd');
  const end = format(now, 'yyyy-MM-dd');

  const params = new URLSearchParams({
    latitude: LAT.toString(),
    longitude: LON.toString(),
    hourly: [
      'temperature_2m',
      'wind_speed_10m',
      'shortwave_radiation',
      'cloud_cover',
      'surface_pressure',
    ].join(','),
    wind_speed_unit: 'ms',
    timezone: 'UTC',
    start_date: start,
    end_date: end,
  });

  const response = await fetch(`${BASE_URL}/forecast?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo history error: ${response.status}`);

  const data = await response.json();
  const hourly = data.hourly;
  const times: string[] = hourly.time ?? [];

  // Get only last 24 entries
  const last24 = times.slice(-24);
  const tempArr: number[] = hourly.temperature_2m?.slice(-24) ?? [];
  const windArr: number[] = hourly.wind_speed_10m?.slice(-24) ?? [];
  const irrArr: number[] = hourly.shortwave_radiation?.slice(-24) ?? [];
  const cloudArr: number[] = hourly.cloud_cover?.slice(-24) ?? [];
  const pressArr: number[] = hourly.surface_pressure?.slice(-24) ?? [];

  return last24.map((time, i) => ({
    timestamp: new Date(time + ':00Z').toISOString(),
    temperatureCelsius: tempArr[i] ?? -20,
    windSpeedMs: windArr[i] ?? 8,
    solarIrradianceWm2: Math.round(irrArr[i] ?? 0),
    cloudCoverPercent: cloudArr[i] ?? 50,
    pressureHpa: pressArr[i] ?? 980,
  }));
}

// ---- Fetch 7-day weather forecast ----
export async function fetchWeatherForecast7d() {
  const params = new URLSearchParams({
    latitude: LAT.toString(),
    longitude: LON.toString(),
    daily: [
      'temperature_2m_min',
      'temperature_2m_max',
      'wind_speed_10m_max',
      'cloud_cover_mean',
      'weather_code',
    ].join(','),
    wind_speed_unit: 'ms',
    timezone: 'UTC',
    forecast_days: '7',
  });

  const response = await fetch(`${BASE_URL}/forecast?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo forecast error: ${response.status}`);

  const data = await response.json();
  const daily = data.daily;
  const dates: string[] = daily.time ?? [];

  return dates.map((date, i) => {
    const minTemp: number = daily.temperature_2m_min?.[i] ?? -25;
    const maxTemp: number = daily.temperature_2m_max?.[i] ?? -15;
    const windMs: number = daily.wind_speed_10m_max?.[i] ?? 10;
    const cloudPct: number = daily.cloud_cover_mean?.[i] ?? 50;
    const wmoCode: number = daily.weather_code?.[i] ?? 0;
    const { description } = wmoToCode(wmoCode);

    // Energy risk from day's conditions
    let energyRisk: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
    if (windMs > 20 || minTemp < -35) energyRisk = 'CRITICAL';
    else if (windMs > 15 || minTemp < -28) energyRisk = 'WARNING';
    else if (windMs > 10 || minTemp < -22) energyRisk = 'WATCH';
    else energyRisk = 'NORMAL';

    return {
      date,
      minTemp: Math.round(minTemp),
      maxTemp: Math.round(maxTemp),
      windSpeedMs: parseFloat(windMs.toFixed(1)),
      cloudCoverPct: Math.round(cloudPct),
      description,
      energyRisk,
    };
  });
}
