import { addHours, addMinutes } from 'date-fns';
import type { ForecastSummary, ForecastDataPoint } from '@/types';

const BASE_TIME = new Date('2026-09-16T05:00:00Z');

function makeForecastPoints(
  horizonHours: number,
  intervalMinutes: number,
  baseMW: number,
  variancePct: number,
): ForecastDataPoint[] {
  const points: ForecastDataPoint[] = [];
  const total = (horizonHours * 60) / intervalMinutes;

  for (let i = 0; i < total; i++) {
    const ts = addMinutes(BASE_TIME, i * intervalMinutes);
    const isFuture = i > 0;
    // Deterministic wave pattern
    const wave = Math.sin((i / total) * Math.PI * 2) * baseMW * 0.12;
    const trend = i > total * 0.6 ? (i / total - 0.6) * baseMW * 0.15 : 0;
    const predicted = baseMW + wave + trend;
    const variance = predicted * (variancePct / 100);

    points.push({
      timestamp: ts.toISOString(),
      actual: isFuture ? undefined : predicted * (1 - 0.02 + (i % 7) * 0.006),
      predicted,
      lowerBound: predicted - variance * 1.5,
      upperBound: predicted + variance * 1.5,
      confidence: i < total * 0.3 ? 'HIGH' : i < total * 0.7 ? 'MEDIUM' : 'LOW',
      isFuture,
    });
  }
  return points;
}

export const forecast1h: ForecastSummary = {
  horizon: '1h',
  generatedAt: BASE_TIME.toISOString(),
  modelVersion: 'EnergyForecast-v1.2',
  overallConfidence: 'HIGH',
  predictedPeakLoad: 2.95,
  predictedMinLoad: 2.78,
  predictedAvgLoad: 2.86,
  predictedRenewable: 1.08,
  predictedFuelConsumption: 87.4,
  predictedEndSOC: 72.5,
  predictedGeneratorRuntime: 1.0,
  shortageProbability: 3,
  dataPoints: makeForecastPoints(1, 5, 2.84, 4),
};

export const forecast6h: ForecastSummary = {
  horizon: '6h',
  generatedAt: BASE_TIME.toISOString(),
  modelVersion: 'EnergyForecast-v1.2',
  overallConfidence: 'HIGH',
  predictedPeakLoad: 3.15,
  predictedMinLoad: 2.72,
  predictedAvgLoad: 2.92,
  predictedRenewable: 0.98,
  predictedFuelConsumption: 531,
  predictedEndSOC: 68.2,
  predictedGeneratorRuntime: 6.0,
  shortageProbability: 8,
  dataPoints: makeForecastPoints(6, 15, 2.9, 6),
};

export const forecast24h: ForecastSummary = {
  horizon: '24h',
  generatedAt: BASE_TIME.toISOString(),
  modelVersion: 'EnergyForecast-v1.2',
  overallConfidence: 'MEDIUM',
  predictedPeakLoad: 3.42,
  predictedMinLoad: 2.35,
  predictedAvgLoad: 2.88,
  predictedRenewable: 1.05,
  predictedFuelConsumption: 2099,
  predictedEndSOC: 61.8,
  predictedGeneratorRuntime: 24.0,
  shortageProbability: 15,
  dataPoints: makeForecastPoints(24, 30, 2.88, 9),
};

export const forecast7d: ForecastSummary = {
  horizon: '7d',
  generatedAt: BASE_TIME.toISOString(),
  modelVersion: 'EnergyForecast-v1.2',
  overallConfidence: 'LOW',
  predictedPeakLoad: 3.68,
  predictedMinLoad: 2.12,
  predictedAvgLoad: 2.90,
  predictedRenewable: 1.02,
  predictedFuelConsumption: 14700,
  predictedEndSOC: 55.0,
  predictedGeneratorRuntime: 168,
  shortageProbability: 24,
  dataPoints: makeForecastPoints(168, 240, 2.9, 14),
};

export const forecastsByHorizon = {
  '1h': forecast1h,
  '6h': forecast6h,
  '24h': forecast24h,
  '7d': forecast7d,
};

// Renewable forecast (solar + wind combined)
export const renewableForecast24h = (() => {
  const solarPattern = [
    0, 0, 0, 0, 0.05, 0.15, 0.28, 0.38, 0.45, 0.48, 0.48, 0.46,
    0.43, 0.40, 0.35, 0.28, 0.18, 0.08, 0.02, 0, 0, 0, 0, 0,
  ];
  const windPattern = [
    0.65, 0.68, 0.70, 0.72, 0.70, 0.68, 0.65, 0.62, 0.60, 0.58, 0.60, 0.62,
    0.64, 0.66, 0.65, 0.63, 0.62, 0.64, 0.66, 0.68, 0.67, 0.66, 0.66, 0.65,
  ];
  return solarPattern.map((solar, i) => ({
    timestamp: addHours(BASE_TIME, i).toISOString(),
    solar,
    wind: windPattern[i],
    total: solar + windPattern[i],
    isFuture: i > 0,
  }));
})();
