import { addHours } from 'date-fns';
import type { FuelData, FuelForecast } from '@/types';

const BASE_TIME = new Date('2026-09-16T05:00:00Z');

export const fuelData: FuelData = {
  timestamp: BASE_TIME.toISOString(),
  capacityLiters: 50000,
  currentLevelLiters: 34000,
  levelPercent: 68.0,
  consumptionRateLph: 87.4,   // liters per hour at current load
  estimatedRuntimeHours: 389, // 34000 / 87.4
  estimatedDepletionTime: addHours(BASE_TIME, 389).toISOString(),
  dailyConsumptionLiters: 2098,
  weeklyConsumptionLiters: 14685,
  lastRefillTime: new Date('2026-09-10T08:00:00Z').toISOString(),
  lastRefillAmount: 15000,
  nextRefillScheduled: addHours(BASE_TIME, 96).toISOString(),
  status: 'NORMAL',
  alerts: [],
};

// Fuel forecast over next 48 hours (every 2 hours)
export const fuelForecast48h: FuelForecast[] = (() => {
  const points: FuelForecast[] = [];
  let levelLiters = 34000;
  let cumulative = 0;

  // First 8 points = historical (before now)
  for (let i = -8; i <= 24; i++) {
    const isHistory = i < 0;
    const hourlyRate = isHistory
      ? 87 + (i % 3) * 2
      : 87.4 + (i % 5) * 3;

    if (i < 0) {
      levelLiters += hourlyRate * 2; // Going back in time
    } else {
      levelLiters -= hourlyRate * 2;
      cumulative += hourlyRate * 2;
    }

    points.push({
      timestamp: addHours(BASE_TIME, i * 2).toISOString(),
      levelLiters: Math.max(0, levelLiters),
      levelPercent: Math.max(0, (levelLiters / 50000) * 100),
      cumulativeConsumption: cumulative,
      scenarioType: i < 0 ? 'OBSERVED' : 'FORECAST',
    });
  }

  return points;
})();

// Optimized scenario
export const fuelForecastOptimized: FuelForecast[] = fuelForecast48h
  .filter((p) => p.scenarioType === 'FORECAST')
  .map((p, i) => ({
    ...p,
    levelLiters: p.levelLiters + i * 180,
    levelPercent: Math.min(100, p.levelPercent + i * 0.36),
    cumulativeConsumption: p.cumulativeConsumption * 0.87,
    scenarioType: 'OPTIMIZED' as const,
  }));
