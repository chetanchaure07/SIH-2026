// ============================================================
// Forecast Controller
// GET /api/forecast?horizon=24h — latest forecast row for a horizon
// GET /api/forecast/all         — latest row for each horizon
// POST /api/forecast/results    — store a computed forecast result
// ============================================================

import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

const VALID_HORIZONS = ['1h', '6h', '24h', '7d'] as const;
type Horizon = typeof VALID_HORIZONS[number];

// GET /api/forecast?horizon=24h
export async function getForecastHandler(req: Request, res: Response): Promise<void> {
  try {
    const horizon = (req.query.horizon as string) ?? '24h';

    if (!VALID_HORIZONS.includes(horizon as Horizon)) {
      res.status(400).json({ error: `Invalid horizon. Must be one of: ${VALID_HORIZONS.join(', ')}.` });
      return;
    }

    const result = await pool.query(`
      SELECT *
      FROM forecast_results
      WHERE forecast_horizon = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `, [horizon]);

    if (result.rows.length === 0) {
      res.status(404).json({
        error: `No forecast data found for horizon "${horizon}". Run seed.sql to insert sample data.`,
      });
      return;
    }

    const row = result.rows[0];
    const predictedKw = parseFloat(row.predicted_demand_kw);

    // Return a ForecastSummary-compatible object
    const forecast = {
      horizon:                   row.forecast_horizon,
      generatedAt:               row.timestamp,
      modelVersion:              'rule-based-v1.0',     // Honest: not ML
      overallConfidence:         row.confidence_level,
      predictedPeakLoad:         (predictedKw * 1.12) / 1000,   // MW
      predictedMinLoad:          (predictedKw * 0.85) / 1000,
      predictedAvgLoad:          predictedKw / 1000,
      predictedRenewable:        (predictedKw * 0.38) / 1000,    // ~38% renewable
      predictedFuelConsumption:  predictedKw * 0.087,            // Approx L based on diesel heat rate
      predictedEndSOC:           70.0,                           // Placeholder
      predictedGeneratorRuntime: horizon === '1h' ? 1 : horizon === '6h' ? 6 : horizon === '24h' ? 24 : 168,
      shortageProbability:       row.confidence_level === 'HIGH' ? 5 : row.confidence_level === 'MEDIUM' ? 15 : 25,
      dataPoints:                [],                             // Full time series not stored in Phase 1
      _note: 'dataPoints not available from DB in Phase 1. Frontend falls back to mock dataPoints for charting.',
    };

    res.json(forecast);
  } catch (err) {
    console.error('[forecastController] getForecast error:', err);
    res.status(500).json({ error: 'Database error fetching forecast.' });
  }
}

// GET /api/forecast/all — latest row per horizon
export async function getAllForecastsHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (forecast_horizon)
        *
      FROM forecast_results
      ORDER BY forecast_horizon, timestamp DESC
    `);

    const forecasts: Record<string, unknown> = {};
    for (const row of result.rows) {
      const predictedKw = parseFloat(row.predicted_demand_kw);
      forecasts[row.forecast_horizon] = {
        horizon:              row.forecast_horizon,
        generatedAt:          row.timestamp,
        modelVersion:         'rule-based-v1.0',
        overallConfidence:    row.confidence_level,
        predictedAvgLoad:     predictedKw / 1000,
        predictedPeakLoad:    (predictedKw * 1.12) / 1000,
        predictedMinLoad:     (predictedKw * 0.85) / 1000,
        predictedRenewable:   (predictedKw * 0.38) / 1000,
        shortageProbability:  row.confidence_level === 'HIGH' ? 5 : row.confidence_level === 'MEDIUM' ? 15 : 25,
        dataPoints:           [],
      };
    }

    res.json(forecasts);
  } catch (err) {
    console.error('[forecastController] getAllForecasts error:', err);
    res.status(500).json({ error: 'Database error fetching all forecasts.' });
  }
}

// POST /api/forecast/results
// Body: { predicted_demand_kw: number, forecast_horizon: string, confidence_level?: string }
export async function postForecastResultHandler(req: Request, res: Response): Promise<void> {
  try {
    const { predicted_demand_kw, forecast_horizon, confidence_level } = req.body as Record<string, unknown>;

    if (typeof predicted_demand_kw !== 'number' || predicted_demand_kw <= 0) {
      res.status(400).json({ error: 'predicted_demand_kw must be a positive number.' });
      return;
    }
    if (!VALID_HORIZONS.includes(forecast_horizon as Horizon)) {
      res.status(400).json({ error: `forecast_horizon must be one of: ${VALID_HORIZONS.join(', ')}.` });
      return;
    }

    const result = await pool.query(
      `INSERT INTO forecast_results (predicted_demand_kw, forecast_horizon, confidence_level)
       VALUES ($1, $2, $3)
       RETURNING id, timestamp`,
      [predicted_demand_kw, forecast_horizon, confidence_level ?? 'MEDIUM'],
    );

    res.status(201).json({ id: result.rows[0].id, timestamp: result.rows[0].timestamp });
  } catch (err) {
    console.error('[forecastController] postForecastResult error:', err);
    res.status(500).json({ error: 'Database error inserting forecast result.' });
  }
}
