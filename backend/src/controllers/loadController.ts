// ============================================================
// Load Controller
// POST /api/load/readings — insert load readings by priority
// GET  /api/load/current  — latest load readings per priority
// ============================================================

import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

const VALID_PRIORITIES = ['critical', 'essential', 'non_critical'] as const;

// GET /api/load/current
export async function getLoadCurrentHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (priority)
        priority, load_kw, timestamp
      FROM load_readings
      ORDER BY priority, timestamp DESC
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No load readings found. Run seed.sql to insert sample data.' });
      return;
    }

    const rows = result.rows.map((row) => ({
      priority:    row.priority,
      load_kw:     parseFloat(row.load_kw),
      load_mw:     parseFloat(row.load_kw) / 1000,
      timestamp:   row.timestamp,
    }));

    res.json(rows);
  } catch (err) {
    console.error('[loadController] getLoadCurrent error:', err);
    res.status(500).json({ error: 'Database error fetching load readings.' });
  }
}

// POST /api/load/readings
// Body: { load_kw: number, priority: string } or array of same.
export async function postLoadReadingHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    const readings: Array<{ load_kw: number; priority: string }> = Array.isArray(body) ? body : [body];

    for (const r of readings) {
      if (typeof r.load_kw !== 'number' || r.load_kw < 0) {
        res.status(400).json({ error: 'load_kw must be a non-negative number.' });
        return;
      }
      if (!VALID_PRIORITIES.includes(r.priority as typeof VALID_PRIORITIES[number])) {
        res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
        return;
      }
    }

    const insertedIds: number[] = [];
    for (const r of readings) {
      const result = await pool.query(
        'INSERT INTO load_readings (load_kw, priority) VALUES ($1, $2) RETURNING id',
        [r.load_kw, r.priority],
      );
      insertedIds.push(result.rows[0].id);
    }

    res.status(201).json({ inserted: insertedIds.length, ids: insertedIds });
  } catch (err) {
    console.error('[loadController] postLoadReading error:', err);
    res.status(500).json({ error: 'Database error inserting load reading.' });
  }
}
