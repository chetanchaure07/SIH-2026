// ============================================================
// SIH-2026 — Express Backend Server
// Polar Research Station Energy Management System
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env file before anything else
dotenv.config();

// Route imports
import energyRouter   from './routes/energy.js';
import batteryRouter  from './routes/battery.js';
import weatherRouter  from './routes/weather.js';
import forecastRouter from './routes/forecast.js';
import dashboardRouter from './routes/dashboard.js';
import loadRouter     from './routes/load.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ---- Middleware -----------------------------------------------

// CORS: allow the Vite dev server (port 5173) and any configured frontend origin
const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? 'http://localhost:5173';
app.use(cors({
  origin: [FRONTEND_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

// ---- Health Check --------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SIH-2026 Polar Energy Backend',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// ---- API Routes ----------------------------------------------
app.use('/api/energy',    energyRouter);
app.use('/api/battery',   batteryRouter);
app.use('/api/weather',   weatherRouter);
app.use('/api/forecast',  forecastRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/load',      loadRouter);

// ---- 404 handler ---------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'GET  /health',
      'GET  /api/energy/current',
      'GET  /api/energy/history',
      'POST /api/energy/readings',
      'GET  /api/battery/current',
      'GET  /api/battery/history',
      'POST /api/battery/readings',
      'GET  /api/weather/current',
      'GET  /api/weather/history',
      'POST /api/weather/readings',
      'GET  /api/forecast?horizon=<1h|6h|24h|7d>',
      'GET  /api/forecast/all',
      'POST /api/forecast/results',
      'GET  /api/dashboard/summary',
      'GET  /api/load/current',
      'POST /api/load/readings',
    ],
  });
});

// ---- Global error handler ------------------------------------
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.', message: err.message });
});

// ---- Start server --------------------------------------------
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  SIH-2026  Polar Energy Management Backend          ║');
  console.log(`║  Running on: http://localhost:${PORT}                    ║`);
  console.log(`║  Frontend:   ${FRONTEND_ORIGIN}               ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  API Endpoints:');
  console.log(`  • GET  http://localhost:${PORT}/health`);
  console.log(`  • GET  http://localhost:${PORT}/api/dashboard/summary`);
  console.log(`  • GET  http://localhost:${PORT}/api/energy/current`);
  console.log(`  • GET  http://localhost:${PORT}/api/battery/current`);
  console.log(`  • GET  http://localhost:${PORT}/api/weather/current`);
  console.log(`  • GET  http://localhost:${PORT}/api/forecast?horizon=24h`);
  console.log('');
});

export default app;
