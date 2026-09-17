// ============================================================
// Battery Controller
// GET  /api/battery/current  — latest battery status row
// GET  /api/battery/history  — SOC timeline for charting
// POST /api/battery/readings — insert a new battery status row
// ============================================================

import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

// GET /api/battery/current
export async function getBatteryCurrentHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT id, timestamp, soc, health, charge_discharge_kw
      FROM battery_status
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No battery status records found. Run seed.sql to insert sample data.' });
      return;
    }

    const row = result.rows[0];
    const chargePowerKw: number = parseFloat(row.charge_discharge_kw);
    const socPct: number        = parseFloat(row.soc);
    const healthPct: number     = parseFloat(row.health);

    // Map to frontend BatteryData shape
    const batteryData = {
      timestamp:              row.timestamp,
      socPercent:             socPct,
      sohPercent:             healthPct,
      capacityMWh:            20.0,
      usableCapacityMWh:      20.0 * (healthPct / 100),
      availableEnergyMWh:     parseFloat(((socPct / 100) * 20.0 * (healthPct / 100)).toFixed(2)),
      currentPowerMW:         chargePowerKw / 1000,   // positive = charging, negative = discharging
      chargeRateMW:           2.0,
      dischargeRateMW:        3.0,
      temperatureCelsius:     -8.4,       // Not stored per-row in Phase 1; constant for now
      cycleCount:             412,        // Placeholder until cycle tracking is added
      estimatedRuntimeHours:  socPct > 0 ? parseFloat(((socPct / 100 * 20.0 * 1000) / Math.max(1, Math.abs(chargePowerKw))).toFixed(1)) : 0,
      status:                 socPct < 15 ? 'CRITICAL' : socPct < 25 ? 'WARNING' : socPct < 40 ? 'WATCH' : 'NORMAL',
      mode:                   chargePowerKw > 50 ? 'CHARGING' : chargePowerKw < -50 ? 'DISCHARGING' : 'IDLE',
    };

    res.json(batteryData);
  } catch (err) {
    console.error('[batteryController] getBatteryCurrent error:', err);
    res.status(500).json({ error: 'Database error fetching battery status.' });
  }
}

// GET /api/battery/history?hours=24
// Returns SOC timeline rows for charting.
export async function getBatteryHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const hours = parseInt((req.query.hours as string) ?? '24', 10);
    const safeHours = Math.min(Math.max(hours, 1), 168);

    const result = await pool.query(`
      SELECT timestamp, soc, charge_discharge_kw
      FROM battery_status
      WHERE timestamp >= NOW() - ($1 || ' hours')::INTERVAL
      ORDER BY timestamp ASC
    `, [safeHours]);

    const rows = result.rows.map((row) => ({
      timestamp:    row.timestamp,
      socPercent:   parseFloat(row.soc),
      powerMW:      parseFloat(row.charge_discharge_kw) / 1000,
      isForecasted: false,
    }));

    res.json(rows);
  } catch (err) {
    console.error('[batteryController] getBatteryHistory error:', err);
    res.status(500).json({ error: 'Database error fetching battery history.' });
  }
}

// POST /api/battery/readings
// Body: { soc: number, health: number, charge_discharge_kw: number }
export async function postBatteryReadingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { soc, health, charge_discharge_kw } = req.body as Record<string, unknown>;

    if (typeof soc !== 'number' || soc < 0 || soc > 100) {
      res.status(400).json({ error: 'soc must be a number between 0 and 100.' });
      return;
    }
    if (typeof health !== 'number' || health < 0 || health > 100) {
      res.status(400).json({ error: 'health must be a number between 0 and 100.' });
      return;
    }
    if (typeof charge_discharge_kw !== 'number') {
      res.status(400).json({ error: 'charge_discharge_kw must be a number.' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO battery_status (soc, health, charge_discharge_kw) VALUES ($1, $2, $3) RETURNING id, timestamp',
      [soc, health, charge_discharge_kw],
    );

    res.status(201).json({ id: result.rows[0].id, timestamp: result.rows[0].timestamp });
  } catch (err) {
    console.error('[batteryController] postBatteryReading error:', err);
    res.status(500).json({ error: 'Database error inserting battery reading.' });
  }
}
