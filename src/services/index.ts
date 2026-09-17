// ============================================================
// Service Layer — all data access goes through here.
//
// MODES:
//  DEMO mode → returns mock/simulated data (no backend needed)
//  LIVE mode → fetches from Express backend (PostgreSQL)
//              falls back to mock data if API is unreachable
//
// Weather always tries the real Open-Meteo API first (via backend
// in LIVE mode, directly in DEMO mode), with mock fallback.
// ============================================================

import { currentEnergySnapshot, energyHistory24h, energyHistory7d } from '@/mock/energyData';
import { fuelData, fuelForecast48h, fuelForecastOptimized } from '@/mock/fuelData';
import { batteryData, batterySOCTimeline } from '@/mock/batteryData';
import { generators, generatorSchedule } from '@/mock/generatorData';
import { loadGroups } from '@/mock/loadsData';
import { forecast1h, forecast6h, forecast24h, forecast7d, renewableForecast24h } from '@/mock/forecastData';
import { currentWeather, weatherHistory24h, weatherForecast7d } from '@/mock/weatherData';
import { aiRecommendations, aiModelInfo } from '@/mock/aiData';
import { maintenanceData } from '@/mock/maintenanceData';
import { stationData } from '@/mock/stationData';
import {
  fetchCurrentWeather,
  fetchWeatherHistory24h,
  fetchWeatherForecast7d,
} from '@/services/weatherApi';
import type { ForecastSummary } from '@/types';

// ---- API configuration ---------------------------------------
// VITE_API_URL is set in .env — falls back to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Simulate network latency in demo mode only
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Generic API fetch with mock fallback --------------------
// Attempts to call the Express backend. On any failure (network
// error, non-2xx, JSON parse error), logs a warning and returns
// the provided fallback value so the UI keeps working.
async function apiFetch<T>(path: string, fallback: T, label: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      signal: AbortSignal.timeout(5000), // 5s timeout for local API
    });
    if (!response.ok) {
      console.warn(`[${label}] API returned ${response.status}, using mock fallback.`);
      return fallback;
    }
    const data = (await response.json()) as T;
    return data;
  } catch (err) {
    console.warn(`[${label}] API unreachable (${(err as Error).message}), using mock fallback.`);
    return fallback;
  }
}

// ---- Energy Service ------------------------------------------
export const energyService = {
  getCurrentSnapshot: async () => {
    return apiFetch('/api/energy/current', currentEnergySnapshot, 'energyService.getCurrentSnapshot');
  },
  getHistory24h: async () => {
    return apiFetch('/api/energy/history?hours=24', energyHistory24h, 'energyService.getHistory24h');
  },
  getHistory7d: async () => {
    return apiFetch('/api/energy/history?hours=168', energyHistory7d, 'energyService.getHistory7d');
  },
};

// ---- Fuel Service --------------------------------------------
// Fuel data does not have a backend endpoint in Phase 1.
// It continues to use mock data. A fuel table will be added in Phase 2.
export const fuelService = {
  getFuelData:          async () => { await delay(50);  return fuelData; },
  getFuel48hForecast:   async () => { await delay(100); return fuelForecast48h; },
  getOptimizedForecast: async () => { await delay(100); return fuelForecastOptimized; },
};

// ---- Battery Service -----------------------------------------
export const batteryService = {
  getBatteryData: async () => {
    return apiFetch('/api/battery/current', batteryData, 'batteryService.getBatteryData');
  },
  getSOCTimeline: async () => {
    return apiFetch('/api/battery/history?hours=24', batterySOCTimeline, 'batteryService.getSOCTimeline');
  },
};

// ---- Generator Service ---------------------------------------
// Generator data does not have a backend endpoint in Phase 1.
export const generatorService = {
  getGenerators: async () => { await delay(80); return generators; },
  getSchedule:   async () => { await delay(80); return generatorSchedule; },
};

// ---- Load Service --------------------------------------------
// Load data does not have a backend endpoint in Phase 1.
export const loadService = {
  getLoadGroups: async () => { await delay(80); return loadGroups; },
};

// ---- Forecast Service ----------------------------------------
// Phase 1: only the summary metadata comes from the DB.
// dataPoints still come from mock (full time-series not stored in Phase 1).
export const forecastService = {
  getForecast: async (horizon: '1h' | '6h' | '24h' | '7d'): Promise<ForecastSummary> => {
    const mockMap = { '1h': forecast1h, '6h': forecast6h, '24h': forecast24h, '7d': forecast7d };
    const mockFallback = mockMap[horizon];
    const apiData = await apiFetch(
      `/api/forecast?horizon=${horizon}`,
      null,
      `forecastService.getForecast(${horizon})`,
    );
    if (!apiData) return mockFallback;
    // Merge: use DB summary values but keep mock dataPoints for charting
    return {
      ...mockFallback,
      ...(apiData as Partial<ForecastSummary>),
      dataPoints: mockFallback.dataPoints, // charts still need full time-series
    };
  },
  getRenewableForecast24h: async () => { await delay(100); return renewableForecast24h; },
};

// ---- Weather Service -----------------------------------------
// In LIVE mode: calls backend /api/weather/current which handles
//   Open-Meteo → DB persistence → offline fallback automatically.
// In DEMO mode: calls Open-Meteo directly with mock fallback.
export const weatherService = {
  getCurrentWeather: async () => {
    // Always try backend first (it handles the full caching chain)
    const backendData = await apiFetch('/api/weather/current', null, 'weatherService.getCurrentWeather (backend)');
    if (backendData) return backendData;
    // Backend down → fall back to direct Open-Meteo call (DEMO mode or backend offline)
    try {
      return await fetchCurrentWeather();
    } catch {
      console.warn('[weatherService] Open-Meteo also failed, using static mock data.');
      return currentWeather;
    }
  },
  getHistory24h: async () => {
    const backendData = await apiFetch('/api/weather/history?hours=24', null, 'weatherService.getHistory24h');
    if (backendData) return backendData;
    try {
      return await fetchWeatherHistory24h();
    } catch {
      return weatherHistory24h;
    }
  },
  getForecast7d: async () => {
    // 7-day forecast is not stored in Phase 1 DB — always use Open-Meteo directly
    try {
      return await fetchWeatherForecast7d();
    } catch {
      console.warn('[weatherService] Forecast API failed, using mock data.');
      return weatherForecast7d;
    }
  },
};

// ---- AI Service ----------------------------------------------
// No real AI/ML implemented. Mock data retained as-is.
// A Python ML service endpoint (/api/ai/...) will be added in a future phase.
export const aiService = {
  getRecommendations:    async () => { await delay(120); return aiRecommendations; },
  getModelInfo:          async () => { await delay(50);  return aiModelInfo; },
  acceptRecommendation:  async (id: string) => { await delay(200); return { id, status: 'ACCEPTED' }; },
  rejectRecommendation:  async (id: string, reason?: string) => { await delay(200); return { id, status: 'REJECTED', reason }; },
};

// ---- Maintenance Service -------------------------------------
export const maintenanceService = {
  getAssets: async () => { await delay(100); return maintenanceData; },
};

// ---- Station Service -----------------------------------------
export const stationService = {
  getStationInfo: async () => { await delay(30); return stationData; },
};

// ---- Dashboard Summary (combined endpoint) -------------------
// Fetches all key metrics in a single round-trip.
export const dashboardService = {
  getSummary: async () => {
    return apiFetch('/api/dashboard/summary', null, 'dashboardService.getSummary');
  },
};
