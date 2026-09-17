// ============================================================
// Dashboard Controller
// GET /api/dashboard/summary
// Returns a single combined object with the latest values from
// all core tables — intended as the primary endpoint for the
// OverviewPage to reduce round-trip count.
// ============================================================

import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

export async function getDashboardSummaryHandler(req: Request, res: Response): Promise<void> {
  try {
    // Run all queries in parallel
    const [energyResult, batteryResult, weatherResult, loadResult, forecastResult] = await Promise.all([
      // Latest energy reading per source
      pool.query(`
        SELECT DISTINCT ON (source) source, power_kw, timestamp
        FROM energy_readings
        ORDER BY source, timestamp DESC
      `),
      // Latest battery status
      pool.query(`
        SELECT soc, health, charge_discharge_kw, timestamp
        FROM battery_status
        ORDER BY timestamp DESC
        LIMIT 1
      `),
      // Latest weather
      pool.query(`
        SELECT temperature, wind_speed, solar_irradiance, cloud_cover, weather_code, humidity, pressure_hpa, timestamp
        FROM weather_data
        ORDER BY timestamp DESC
        LIMIT 1
      `),
      // Latest load per priority
      pool.query(`
        SELECT DISTINCT ON (priority) priority, load_kw, timestamp
        FROM load_readings
        ORDER BY priority, timestamp DESC
      `),
      // Latest 24h forecast
      pool.query(`
        SELECT predicted_demand_kw, confidence_level, timestamp
        FROM forecast_results
        WHERE forecast_horizon = '24h'
        ORDER BY timestamp DESC
        LIMIT 1
      `),
    ]);

    // --- Build energy snapshot ---
    const energyMap: Record<string, number> = {};
    let energyTimestamp = new Date().toISOString();
    for (const row of energyResult.rows) {
      energyMap[row.source] = parseFloat(row.power_kw);
      if (row.timestamp > energyTimestamp) energyTimestamp = row.timestamp;
    }

    const solar     = energyMap['solar']      ?? 0;
    const wind      = energyMap['wind']        ?? 0;
    const diesel    = energyMap['diesel']      ?? 0;
    const battery   = energyMap['battery']     ?? 0;
    const totalLoad = energyMap['total_load']  ?? (solar + wind + diesel + Math.abs(battery));
    const renewGen  = solar + wind;
    const totalGen  = solar + wind + diesel + Math.max(0, -battery);

    const energy = energyResult.rows.length > 0 ? {
      timestamp:                energyTimestamp,
      totalLoadMW:              totalLoad / 1000,
      totalGenerationMW:        totalGen  / 1000,
      renewableGenerationMW:    renewGen  / 1000,
      solarGenerationMW:        solar  / 1000,
      windGenerationMW:         wind   / 1000,
      generatorOutputMW:        diesel / 1000,
      batteryOutputMW:          -battery / 1000,
      gridBalanceMW:            (totalGen - totalLoad) / 1000,
      renewableContributionPct: totalLoad > 0 ? (renewGen / totalLoad) * 100 : 0,
      powerBalance:             (totalGen - totalLoad) / 1000,
    } : null;

    // --- Build battery snapshot ---
    const batRow = batteryResult.rows[0];
    const batteryData = batRow ? (() => {
      const soc = parseFloat(batRow.soc);
      const health = parseFloat(batRow.health);
      const chargePowerKw = parseFloat(batRow.charge_discharge_kw);
      return {
        timestamp:           batRow.timestamp,
        socPercent:          soc,
        sohPercent:          health,
        capacityMWh:         20.0,
        usableCapacityMWh:   parseFloat((20.0 * (health / 100)).toFixed(2)),
        availableEnergyMWh:  parseFloat(((soc / 100) * 20.0 * (health / 100)).toFixed(2)),
        currentPowerMW:      chargePowerKw / 1000,
        chargeRateMW:        2.0,
        dischargeRateMW:     3.0,
        temperatureCelsius:  -8.4,
        cycleCount:          412,
        estimatedRuntimeHours: soc > 0
          ? parseFloat(((soc / 100 * 20.0 * 1000) / Math.max(1, Math.abs(chargePowerKw))).toFixed(1))
          : 0,
        status: soc < 15 ? 'CRITICAL' : soc < 25 ? 'WARNING' : soc < 40 ? 'WATCH' : 'NORMAL',
        mode:   chargePowerKw > 50 ? 'CHARGING' : chargePowerKw < -50 ? 'DISCHARGING' : 'IDLE',
      };
    })() : null;

    // --- Build weather snapshot ---
    const wRow = weatherResult.rows[0];
    const weatherData = wRow ? (() => {
      const tempC  = parseFloat(wRow.temperature);
      const windMs = parseFloat(wRow.wind_speed);
      const cloud  = parseFloat(wRow.cloud_cover);
      const heatingLoad = parseFloat((Math.max(0, (-10 - tempC) * 0.025)).toFixed(2));
      let riskLevel: string;
      if (windMs > 20 || tempC < -35)      riskLevel = 'CRITICAL';
      else if (windMs > 15 || tempC < -25) riskLevel = 'WARNING';
      else if (windMs > 10 || tempC < -18) riskLevel = 'WATCH';
      else                                 riskLevel = 'NORMAL';
      return {
        timestamp:              wRow.timestamp,
        temperatureCelsius:     tempC,
        windSpeedMs:            windMs,
        solarIrradianceWm2:     parseFloat(wRow.solar_irradiance),
        cloudCoverPercent:      cloud,
        humidityPercent:        parseFloat(wRow.humidity ?? '70'),
        pressureHpa:            parseFloat(wRow.pressure_hpa ?? '980'),
        weatherCode:            wRow.weather_code,
        energyImpact: {
          heatingLoadIncreaseMW:    heatingLoad,
          solarGenerationImpactPct: -Math.round(cloud * 0.8),
          windGenerationImpactPct:  Math.min(40, Math.round((windMs / 20) * 40)),
          overallRiskLevel:         riskLevel,
        },
      };
    })() : null;

    // --- Build load summary ---
    const loadMap: Record<string, number> = {};
    for (const row of loadResult.rows) {
      loadMap[row.priority] = parseFloat(row.load_kw);
    }
    const loadSummary = loadResult.rows.length > 0 ? {
      criticalKw:    loadMap['critical']    ?? 0,
      essentialKw:   loadMap['essential']   ?? 0,
      nonCriticalKw: loadMap['non_critical'] ?? 0,
      totalKw:       Object.values(loadMap).reduce((a, b) => a + b, 0),
    } : null;

    // --- Build forecast summary ---
    const fcRow = forecastResult.rows[0];
    const forecastSummary = fcRow ? {
      horizon:           '24h',
      generatedAt:       fcRow.timestamp,
      predictedAvgLoad:  parseFloat(fcRow.predicted_demand_kw) / 1000,
      confidenceLevel:   fcRow.confidence_level,
    } : null;

    // --- System health: which tables have data ---
    const dataStatus = {
      energy:   energyResult.rows.length > 0,
      battery:  batteryResult.rows.length > 0,
      weather:  weatherResult.rows.length > 0,
      load:     loadResult.rows.length > 0,
      forecast: forecastResult.rows.length > 0,
    };

    res.json({
      energy:          energy,
      battery:         batteryData,
      weather:         weatherData,
      load:            loadSummary,
      forecast:        forecastSummary,
      dataStatus,
      generatedAt:     new Date().toISOString(),
    });
  } catch (err) {
    console.error('[dashboardController] getDashboardSummary error:', err);
    res.status(500).json({ error: 'Database error generating dashboard summary.' });
  }
}
