import { addMinutes } from 'date-fns';
import type { BatteryData, BatteryForecast } from '@/types';

const BASE_TIME = new Date('2026-09-16T05:00:00Z');

export const batteryData: BatteryData = {
  timestamp: BASE_TIME.toISOString(),
  socPercent: 74.0,
  sohPercent: 93.2,
  capacityMWh: 20.0,
  usableCapacityMWh: 18.64,
  availableEnergyMWh: 13.8,
  currentPowerMW: -0.25, // negative = discharging
  chargeRateMW: 2.0,
  dischargeRateMW: 3.0,
  temperatureCelsius: -8.4,
  cycleCount: 412,
  estimatedRuntimeHours: 55.2,
  status: 'NORMAL',
  mode: 'DISCHARGING',
};

// SOC timeline — last 12 hours + next 12 hours (every 30 min)
export const batterySOCTimeline: BatteryForecast[] = (() => {
  const points: BatteryForecast[] = [];
  // Historical SOC values
  const socHistory = [
    81, 82, 83, 80, 78, 76, 77, 78, 79, 78, 77, 76,
    75, 74.5, 74, 74, 74.2, 74.0, 74.5, 74, 73.8, 73.5, 74, 74,
  ];
  // Forecast SOC (next 12h) — slight discharge trend
  const socForecast = [
    74, 73.5, 73, 72, 71.5, 71, 70.5, 71, 72, 73, 74, 75,
    75.5, 76, 76.5, 77, 76.5, 76, 75.5, 75, 74.5, 74, 73.5, 73,
  ];

  for (let i = 0; i < 48; i++) {
    const isHistorical = i < 24;
    const soc = isHistorical ? socHistory[i] : socForecast[i - 24];
    const power = isHistorical
      ? -0.2 - (i % 5) * 0.04
      : soc > 75 ? 0.5 : -0.3;

    points.push({
      timestamp: addMinutes(BASE_TIME, (i - 24) * 30).toISOString(),
      socPercent: soc,
      powerMW: power,
      isForecasted: !isHistorical,
    });
  }
  return points;
})();
