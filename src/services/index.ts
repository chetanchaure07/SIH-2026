// Service layer — all data access goes through here.
// Replace mock implementations with API calls without touching UI components.

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
import type { ForecastSummary } from '@/types';

// Simulate network latency in demo mode
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const energyService = {
  getCurrentSnapshot: async () => { await delay(50); return currentEnergySnapshot; },
  getHistory24h: async () => { await delay(100); return energyHistory24h; },
  getHistory7d: async () => { await delay(100); return energyHistory7d; },
};

export const fuelService = {
  getFuelData: async () => { await delay(50); return fuelData; },
  getFuel48hForecast: async () => { await delay(100); return fuelForecast48h; },
  getOptimizedForecast: async () => { await delay(100); return fuelForecastOptimized; },
};

export const batteryService = {
  getBatteryData: async () => { await delay(50); return batteryData; },
  getSOCTimeline: async () => { await delay(100); return batterySOCTimeline; },
};

export const generatorService = {
  getGenerators: async () => { await delay(80); return generators; },
  getSchedule: async () => { await delay(80); return generatorSchedule; },
};

export const loadService = {
  getLoadGroups: async () => { await delay(80); return loadGroups; },
};

export const forecastService = {
  getForecast: async (horizon: '1h' | '6h' | '24h' | '7d'): Promise<ForecastSummary> => {
    await delay(150);
    const map = { '1h': forecast1h, '6h': forecast6h, '24h': forecast24h, '7d': forecast7d };
    return map[horizon];
  },
  getRenewableForecast24h: async () => { await delay(100); return renewableForecast24h; },
};

export const weatherService = {
  getCurrentWeather: async () => { await delay(60); return currentWeather; },
  getHistory24h: async () => { await delay(100); return weatherHistory24h; },
  getForecast7d: async () => { await delay(100); return weatherForecast7d; },
};

export const aiService = {
  getRecommendations: async () => { await delay(120); return aiRecommendations; },
  getModelInfo: async () => { await delay(50); return aiModelInfo; },
  // Future: POST /api/ai/recommendations/:id/accept
  acceptRecommendation: async (id: string) => { await delay(200); return { id, status: 'ACCEPTED' }; },
  rejectRecommendation: async (id: string, reason?: string) => { await delay(200); return { id, status: 'REJECTED', reason }; },
};

export const maintenanceService = {
  getAssets: async () => { await delay(100); return maintenanceData; },
};

export const stationService = {
  getStationInfo: async () => { await delay(30); return stationData; },
};
