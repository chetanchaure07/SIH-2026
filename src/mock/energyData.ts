import { subHours, addMinutes, format } from 'date-fns';
import type { EnergySnapshot, EnergyTimeSeries } from '@/types';

// Deterministic base time — anchored to a fixed reference
const BASE_TIME = new Date('2026-09-16T05:00:00Z');

function makeTimestamp(offsetMinutes: number): string {
  return addMinutes(BASE_TIME, offsetMinutes).toISOString();
}

// Current snapshot — used as the "live" reading
export const currentEnergySnapshot: EnergySnapshot = {
  timestamp: makeTimestamp(0),
  totalLoadMW: 2.84,
  totalGenerationMW: 2.89,
  renewableGenerationMW: 1.12,
  solarGenerationMW: 0.48,
  windGenerationMW: 0.64,
  generatorOutputMW: 1.52,
  batteryOutputMW: 0.25,    // positive = discharging
  gridBalanceMW: 0.05,
  renewableContributionPct: 38.8,
  powerBalance: 0.05,
};

// 24-hour historical energy data (every 30 minutes)
export const energyHistory24h: EnergyTimeSeries[] = (() => {
  const points: EnergyTimeSeries[] = [];
  // Base load pattern (MW) for 48 x 30-minute intervals over 24h
  const loadPattern = [
    2.1, 2.0, 1.9, 1.85, 1.8, 1.78,   // 00:00–02:30
    1.75, 1.72, 1.8, 1.9, 2.1, 2.3,   // 03:00–05:30
    2.5, 2.65, 2.75, 2.82, 2.84, 2.9, // 06:00–08:30
    2.95, 3.05, 3.1, 3.15, 3.12, 3.0, // 09:00–11:30
    2.95, 2.9, 2.88, 2.92, 3.0, 3.1,  // 12:00–14:30
    3.08, 3.0, 2.95, 2.88, 2.8, 2.75, // 15:00–17:30
    2.7, 2.65, 2.6, 2.55, 2.5, 2.45,  // 18:00–20:30
    2.4, 2.35, 2.25, 2.2, 2.15, 2.1,  // 21:00–23:30
  ];
  const renewPattern = [
    0.9, 0.85, 0.8, 0.75, 0.72, 0.70,
    0.68, 0.70, 0.78, 0.88, 0.98, 1.05,
    1.12, 1.18, 1.22, 1.2, 1.15, 1.10,
    1.05, 1.0, 0.95, 0.90, 0.88, 0.85,
    0.80, 0.78, 0.80, 0.85, 0.90, 0.95,
    0.92, 0.88, 0.85, 0.80, 0.78, 0.75,
    0.70, 0.68, 0.65, 0.62, 0.60, 0.58,
    0.62, 0.68, 0.75, 0.80, 0.85, 0.88,
  ];

  for (let i = 0; i < 48; i++) {
    const offsetMinutes = (i - 48) * 30; // 24h ago to now
    const load = loadPattern[i];
    const renew = renewPattern[i];
    const genOutput = Math.max(0, load - renew - (i % 8 === 4 ? 0.3 : 0.1));
    points.push({
      timestamp: makeTimestamp(offsetMinutes),
      actual: load,
      predicted: load * (1 + (((i * 17) % 11) - 5) / 100),
      label: format(addMinutes(BASE_TIME, offsetMinutes), 'HH:mm'),
    });
    void renew; void genOutput;
  }
  return points;
})();

// 7-day historical energy (daily averages)
export const energyHistory7d: EnergyTimeSeries[] = (() => {
  const dailyAvg = [2.72, 2.81, 2.65, 2.90, 2.78, 2.84, 2.84];
  const dailyRenew = [1.05, 1.12, 0.88, 1.20, 1.08, 1.15, 1.12];
  return dailyAvg.map((avg, i) => ({
    timestamp: subHours(BASE_TIME, (7 - i) * 24).toISOString(),
    actual: avg,
    predicted: avg * (1 + (i % 3 - 1) * 0.02),
    label: format(subHours(BASE_TIME, (7 - i) * 24), 'MMM d'),
    _renewable: dailyRenew[i],
  }));
})();
