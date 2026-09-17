// ============================================================
// Energy Controller
// GET  /api/energy/current  — latest reading per source
// GET  /api/energy/history  — last 48 readings (all sources)
// POST /api/energy/readings — insert a new reading
// ============================================================

import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

// GET /api/energy/current
// Returns the most recent reading for each source, aggregated into one snapshot object.
export async function getEnergyCurrentHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (source)
        source,
        power_kw,
        timestamp
      FROM energy_readings
      ORDER BY source, timestamp DESC
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No energy readings found. Run seed.sql to insert sample data.' });
      return;
    }

    // Map DB rows into a snapshot object matching the frontend EnergySnapshot type
    const map: Record<string, number> = {};
    let latestTimestamp = '';
    for (const row of result.rows) {
      map[row.source] = parseFloat(row.power_kw);
      if (!latestTimestamp || row.timestamp > latestTimestamp) {
        latestTimestamp = row.timestamp;
      }
    }

    const solar      = map['solar']      ?? 0;
    const wind       = map['wind']       ?? 0;
    const diesel     = map['diesel']     ?? 0;
    const battery    = map['battery']    ?? 0;   // negative = discharging
    const totalLoad  = map['total_load'] ?? (solar + wind + diesel + Math.abs(battery));

    const renewableGen = solar + wind;
    const totalGen     = solar + wind + diesel + Math.max(0, -battery); // discharging adds to supply

    const snapshot = {
      timestamp:                latestTimestamp,
      totalLoadMW:              totalLoad / 1000,
      totalGenerationMW:        totalGen  / 1000,
      renewableGenerationMW:    renewableGen / 1000,
      solarGenerationMW:        solar   / 1000,
      windGenerationMW:         wind    / 1000,
      generatorOutputMW:        diesel  / 1000,
      batteryOutputMW:          -battery / 1000,    // flip: positive = discharging in frontend
      gridBalanceMW:            (totalGen - totalLoad) / 1000,
      renewableContributionPct: totalLoad > 0 ? (renewableGen / totalLoad) * 100 : 0,
      powerBalance:             (totalGen - totalLoad) / 1000,
    };

    res.json(snapshot);
  } catch (err) {
    console.error('[energyController] getEnergyCurrent error:', err);
    res.status(500).json({ error: 'Database error fetching energy snapshot.' });
  }
}

// GET /api/energy/history?hours=24
// Returns timestamped energy readings for charting.
export async function getEnergyHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const hours = parseInt((req.query.hours as string) ?? '24', 10);
    const safeHours = Math.min(Math.max(hours, 1), 168); // clamp 1h–7d

    const result = await pool.query(`
      SELECT
        timestamp,
        SUM(CASE WHEN source = 'total_load' THEN power_kw ELSE 0 END) AS actual_kw,
        SUM(CASE WHEN source IN ('solar', 'wind') THEN power_kw ELSE 0 END) AS renewable_kw
      FROM energy_readings
      WHERE timestamp >= NOW() - ($1 || ' hours')::INTERVAL
      GROUP BY timestamp
      ORDER BY timestamp ASC
    `, [safeHours]);

    const rows = result.rows.map((row) => ({
      timestamp: row.timestamp,
      actual:    parseFloat(row.actual_kw) / 1000,     // kW → MW
      renewable: parseFloat(row.renewable_kw) / 1000,
      label:     new Date(row.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }));

    res.json(rows);
  } catch (err) {
    console.error('[energyController] getEnergyHistory error:', err);
    res.status(500).json({ error: 'Database error fetching energy history.' });
  }
}

// POST /api/energy/readings
// Insert one or more energy readings.
// Body: { source: string, power_kw: number } or array of same.
export async function postEnergyReadingHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    const readings: Array<{ source: string; power_kw: number }> = Array.isArray(body) ? body : [body];

    if (readings.length === 0) {
      res.status(400).json({ error: 'Request body must be a reading object or array of readings.' });
      return;
    }

    const validSources = ['solar', 'wind', 'diesel', 'battery', 'total_load'];
    for (const r of readings) {
      if (!validSources.includes(r.source)) {
        res.status(400).json({ error: `Invalid source "${r.source}". Must be one of: ${validSources.join(', ')}.` });
        return;
      }
      if (typeof r.power_kw !== 'number') {
        res.status(400).json({ error: 'power_kw must be a number.' });
        return;
      }
    }

    const insertedIds: number[] = [];
    for (const r of readings) {
      const result = await pool.query(
        'INSERT INTO energy_readings (source, power_kw) VALUES ($1, $2) RETURNING id',
        [r.source, r.power_kw],
      );
      insertedIds.push(result.rows[0].id);
    }

    res.status(201).json({ inserted: insertedIds.length, ids: insertedIds });
  } catch (err) {
    console.error('[energyController] postEnergyReading error:', err);
    res.status(500).json({ error: 'Database error inserting energy reading.' });
  }
}
