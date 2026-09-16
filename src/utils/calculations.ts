// ============================================================
// PURE UTILITY FUNCTIONS — All unit-testable, no side effects
// ============================================================

import type { SystemStatus, ForecastConfidence, DataFreshness } from '@/types';

/** Calculate estimated fuel runtime in hours */
export function fuelRuntime(levelLiters: number, consumptionRateLph: number): number {
  if (consumptionRateLph <= 0) return Infinity;
  return levelLiters / consumptionRateLph;
}

/** Format fuel runtime as human-readable string */
export function formatFuelRuntime(hours: number): string {
  if (!isFinite(hours)) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/** Calculate current fuel consumption rate from two readings */
export function fuelConsumptionRate(
  prevLevel: number,
  currLevel: number,
  elapsedHours: number,
): number {
  if (elapsedHours <= 0) return 0;
  return (prevLevel - currLevel) / elapsedHours;
}

/** Calculate available battery energy from SOC and usable capacity */
export function batteryAvailableEnergy(socPct: number, usableCapacityMWh: number): number {
  return (socPct / 100) * usableCapacityMWh;
}

/** Calculate battery runtime in hours at given discharge rate */
export function batteryRuntime(availableEnergyMWh: number, dischargeRateMW: number): number {
  if (dischargeRateMW <= 0) return Infinity;
  return availableEnergyMWh / dischargeRateMW;
}

/** Calculate renewable contribution percentage */
export function renewableContribution(renewableMW: number, totalLoadMW: number): number {
  if (totalLoadMW <= 0) return 0;
  return Math.min(100, (renewableMW / totalLoadMW) * 100);
}

/** Calculate net energy balance (positive = surplus, negative = deficit) */
export function energyBalance(generationMW: number, loadMW: number): number {
  return generationMW - loadMW;
}

/** Calculate forecast deviation percentage */
export function forecastDeviation(actual: number, predicted: number): number {
  if (predicted === 0) return 0;
  return ((actual - predicted) / predicted) * 100;
}

/** Determine risk level from a value against thresholds */
export function riskLevel(
  value: number,
  watchThreshold: number,
  warningThreshold: number,
  criticalThreshold: number,
  inverted = false, // true if lower values are worse (e.g., SOC, fuel level)
): SystemStatus {
  if (inverted) {
    if (value <= criticalThreshold) return 'CRITICAL';
    if (value <= warningThreshold) return 'WARNING';
    if (value <= watchThreshold) return 'WATCH';
    return 'NORMAL';
  } else {
    if (value >= criticalThreshold) return 'CRITICAL';
    if (value >= warningThreshold) return 'WARNING';
    if (value >= watchThreshold) return 'WATCH';
    return 'NORMAL';
  }
}

/** Assess data freshness based on how old the timestamp is */
export function dataFreshness(timestampIso: string, staleSecs = 60, offlineSecs = 300): DataFreshness {
  const ageMs = Date.now() - new Date(timestampIso).getTime();
  const ageSecs = ageMs / 1000;
  if (ageSecs > offlineSecs) return 'OFFLINE';
  if (ageSecs > staleSecs) return 'STALE';
  if (ageSecs > 10) return 'RECENT';
  return 'LIVE';
}

/** Format seconds ago for display */
export function formatAge(timestampIso: string): string {
  const ageSecs = Math.floor((Date.now() - new Date(timestampIso).getTime()) / 1000);
  if (ageSecs < 60) return `${ageSecs}s ago`;
  const mins = Math.floor(ageSecs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

/** Calculate generator efficiency as percentage of rated output */
export function generatorEfficiency(outputMW: number, ratedCapacityMW: number): number {
  if (ratedCapacityMW <= 0) return 0;
  return Math.min(100, (outputMW / ratedCapacityMW) * 100);
}

/** Calculate load percentage of rated capacity */
export function loadPercentage(currentMW: number, ratedMW: number): number {
  if (ratedMW <= 0) return 0;
  return Math.min(100, (currentMW / ratedMW) * 100);
}

/** Get color class for system status */
export function statusColor(status: SystemStatus): string {
  switch (status) {
    case 'CRITICAL': return 'text-red-400';
    case 'WARNING': return 'text-amber-400';
    case 'WATCH': return 'text-blue-400';
    case 'NORMAL': return 'text-emerald-400';
  }
}

/** Get background color class for system status */
export function statusBgColor(status: SystemStatus): string {
  switch (status) {
    case 'CRITICAL': return 'bg-red-500/15 border-red-500/30';
    case 'WARNING': return 'bg-amber-500/15 border-amber-500/30';
    case 'WATCH': return 'bg-blue-500/15 border-blue-500/30';
    case 'NORMAL': return 'bg-emerald-500/15 border-emerald-500/30';
  }
}

/** Get color class for forecast confidence */
export function confidenceColor(confidence: ForecastConfidence): string {
  switch (confidence) {
    case 'HIGH': return 'text-emerald-400';
    case 'MEDIUM': return 'text-amber-400';
    case 'LOW': return 'text-red-400';
  }
}

/** Format MW value with appropriate precision */
export function formatMW(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} MW`;
}

/** Format MWh value */
export function formatMWh(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)} MWh`;
}

/** Format percentage */
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format liters */
export function formatLiters(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k L`;
  return `${Math.round(value)} L`;
}

/** Format temperature */
export function formatTemp(celsius: number): string {
  return `${celsius > 0 ? '+' : ''}${celsius.toFixed(1)}°C`;
}

/** Calculate the energy security score from multiple indicators */
export function energySecurityScore(params: {
  fuelPct: number;
  socPct: number;
  sohPct: number;
  generatorHealth: number;
  renewableContributionPct: number;
  shortageProbability: number;
}): number {
  const { fuelPct, socPct, sohPct, generatorHealth, renewableContributionPct, shortageProbability } = params;
  const score =
    fuelPct * 0.25 +
    socPct * 0.25 +
    sohPct * 0.15 +
    generatorHealth * 0.15 +
    Math.min(100, renewableContributionPct * 2) * 0.1 +
    Math.max(0, 100 - shortageProbability * 4) * 0.1;
  return Math.round(Math.min(100, Math.max(0, score)));
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Format wind speed */
export function formatWindSpeed(ms: number): string {
  return `${ms.toFixed(1)} m/s`;
}

/** Get wind direction label */
export function windDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/** Trend indicator text */
export function trendIndicator(current: number, previous: number): string {
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.5) return '→';
  return diff > 0 ? `↑ +${diff.toFixed(1)}%` : `↓ ${diff.toFixed(1)}%`;
}

/** Short number format (e.g., 1200 → 1.2k) */
export function shortNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}
