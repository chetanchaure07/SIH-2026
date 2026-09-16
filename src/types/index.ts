// ============================================================
// CORE TYPES — Polar Research Station Energy Management System
// ============================================================

// ---- Enums & Unions ----------------------------------------

export type SystemStatus = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type DataMode = 'DEMO' | 'LIVE';
export type UserRole = 'ADMIN' | 'ENGINEER' | 'OPERATOR' | 'RESEARCHER' | 'VIEWER';
export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertCategory = 'ENERGY' | 'FUEL' | 'BATTERY' | 'GENERATOR' | 'WEATHER' | 'MAINTENANCE' | 'SYSTEM';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type GeneratorStatus = 'RUNNING' | 'STANDBY' | 'OFFLINE' | 'MAINTENANCE' | 'FAULT';
export type LoadPriority = 'CRITICAL' | 'ESSENTIAL' | 'NON_CRITICAL';
export type AssetHealth = 'HEALTHY' | 'WATCH' | 'MAINTENANCE_REQUIRED' | 'CRITICAL';
export type ForecastConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type DataFreshness = 'LIVE' | 'RECENT' | 'STALE' | 'OFFLINE';
export type RecommendationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type ScenarioStatus = 'NORMAL' | 'STRESSED' | 'CRITICAL';

// ---- Station -----------------------------------------------

export interface StationInfo {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: number;
  totalCapacityMW: number;
  renewableCapacityMW: number;
  batteryCapacityMWh: number;
  fuelCapacityLiters: number;
  generatorCount: number;
  commissionedDate: string;
  operatorOrg: string;
}

// ---- Energy Data -------------------------------------------

export interface EnergySnapshot {
  timestamp: string;
  totalLoadMW: number;
  totalGenerationMW: number;
  renewableGenerationMW: number;
  solarGenerationMW: number;
  windGenerationMW: number;
  generatorOutputMW: number;
  batteryOutputMW: number; // positive = discharging, negative = charging
  gridBalanceMW: number;
  renewableContributionPct: number;
  powerBalance: number; // generation - load
}

export interface EnergyTimeSeries {
  timestamp: string;
  actual: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
  label?: string;
}

// ---- Fuel Data ---------------------------------------------

export interface FuelData {
  timestamp: string;
  capacityLiters: number;
  currentLevelLiters: number;
  levelPercent: number;
  consumptionRateLph: number; // liters per hour
  estimatedRuntimeHours: number;
  estimatedDepletionTime: string; // ISO timestamp
  dailyConsumptionLiters: number;
  weeklyConsumptionLiters: number;
  lastRefillTime: string;
  lastRefillAmount: number;
  nextRefillScheduled?: string;
  status: SystemStatus;
  alerts: string[];
}

export interface FuelForecast {
  timestamp: string;
  levelLiters: number;
  levelPercent: number;
  cumulativeConsumption: number;
  scenarioType: 'OBSERVED' | 'FORECAST' | 'OPTIMIZED';
}

// ---- Battery Data ------------------------------------------

export interface BatteryData {
  timestamp: string;
  socPercent: number; // State of Charge
  sohPercent: number; // State of Health
  capacityMWh: number; // total capacity
  usableCapacityMWh: number;
  availableEnergyMWh: number;
  currentPowerMW: number; // positive = charging, negative = discharging
  chargeRateMW: number;
  dischargeRateMW: number;
  temperatureCelsius: number;
  cycleCount: number;
  estimatedRuntimeHours: number;
  estimatedDepletionTime?: string;
  status: SystemStatus;
  mode: 'CHARGING' | 'DISCHARGING' | 'IDLE' | 'FAULT';
}

export interface BatteryForecast {
  timestamp: string;
  socPercent: number;
  powerMW: number;
  isForecasted: boolean;
}

// ---- Generator Data ----------------------------------------

export interface GeneratorUnit {
  id: string;
  name: string;
  model: string;
  status: GeneratorStatus;
  outputMW: number;
  ratedCapacityMW: number;
  loadPercent: number;
  fuelConsumptionLph: number;
  efficiencyPercent: number;
  runtimeHours: number;
  runtimeTotalHours: number;
  temperatureCelsius: number;
  healthScore: number;
  healthStatus: AssetHealth;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  alerts: string[];
  startedAt?: string;
}

export interface GeneratorScheduleEntry {
  generatorId: string;
  startTime: string;
  endTime: string;
  reason: string;
  isAiRecommended: boolean;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
}

// ---- Load Data ---------------------------------------------

export interface LoadGroup {
  id: string;
  name: string;
  priority: LoadPriority;
  currentMW: number;
  peakMW: number;
  averageMW: number;
  percentOfTotal: number;
  status: 'ACTIVE' | 'REDUCED' | 'SHED';
  loads: IndividualLoad[];
}

export interface IndividualLoad {
  id: string;
  name: string;
  category: string;
  priority: LoadPriority;
  currentMW: number;
  ratedMW: number;
  percentOfRated: number;
  status: 'ACTIVE' | 'STANDBY' | 'OFFLINE';
  controllable: boolean;
}

// ---- Renewable Energy --------------------------------------

export interface SolarData {
  timestamp: string;
  currentGenerationMW: number;
  forecastGenerationMW: number;
  dailyEnergyMWh: number;
  weeklyEnergyMWh: number;
  capacityFactor: number;
  irradianceWm2: number;
  panelTemperatureCelsius: number;
  systemEfficiency: number;
  healthStatus: AssetHealth;
}

export interface WindData {
  timestamp: string;
  currentGenerationMW: number;
  forecastGenerationMW: number;
  windSpeedMs: number;
  windDirectionDeg: number;
  dailyEnergyMWh: number;
  weeklyEnergyMWh: number;
  capacityFactor: number;
  turbineCount: number;
  turbinesOnline: number;
  healthStatus: AssetHealth;
}

// ---- Forecast Data -----------------------------------------

export interface ForecastDataPoint {
  timestamp: string;
  actual?: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: ForecastConfidence;
  isFuture: boolean;
}

export interface ForecastSummary {
  horizon: '1h' | '6h' | '24h' | '7d';
  generatedAt: string;
  modelVersion: string;
  overallConfidence: ForecastConfidence;
  predictedPeakLoad: number;
  predictedMinLoad: number;
  predictedAvgLoad: number;
  predictedRenewable: number;
  predictedFuelConsumption: number;
  predictedEndSOC: number;
  predictedGeneratorRuntime: number;
  shortageProbability: number;
  dataPoints: ForecastDataPoint[];
}

// ---- Weather Data ------------------------------------------

export interface WeatherData {
  timestamp: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  windSpeedMs: number;
  windGustMs: number;
  windDirectionDeg: number;
  precipitationMmh: number;
  snowfallCmh: number;
  visibilityKm: number;
  pressureHpa: number;
  humidityPercent: number;
  solarIrradianceWm2: number;
  cloudCoverPercent: number;
  uvIndex: number;
  weatherCode: string;
  weatherDescription: string;
  policeWarningLevel: number;
  energyImpact: WeatherEnergyImpact;
}

export interface WeatherEnergyImpact {
  heatingLoadIncreaseMW: number;
  solarGenerationImpactPct: number;
  windGenerationImpactPct: number;
  overallRiskLevel: SystemStatus;
  description: string;
}

// ---- Alerts ------------------------------------------------

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  category: AlertCategory;
  source: string;
  title: string;
  description: string;
  impact: string;
  suggestedAction: string;
  status: AlertStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

// ---- AI Recommendations ------------------------------------

export interface AIRecommendation {
  id: string;
  generatedAt: string;
  expiresAt: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  description: string;
  reason: string;
  expectedImpact: string;
  confidence: number; // 0-100
  affectedSystems: string[];
  timeSensitivity: 'IMMEDIATE' | 'SOON' | 'PLANNED';
  status: RecommendationStatus;
  actionAcceptLabel: string;
  actionRejectLabel: string;
  modelVersion: string;
  factors: AIFactor[];
}

export interface AIFactor {
  name: string;
  contribution: number; // percentage contribution
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
}

export interface AIModelInfo {
  name: string;
  version: string;
  lastTrained: string;
  dataCoveragedays: number;
  predictionHorizonHours: number;
  overallConfidence: number;
  accuracy7d: number;
}

// ---- Predictive Maintenance --------------------------------

export interface AssetMaintenanceRecord {
  assetId: string;
  assetName: string;
  assetType: 'GENERATOR' | 'BATTERY' | 'SOLAR' | 'WIND' | 'HVAC' | 'NETWORK' | 'SENSOR';
  healthScore: number;
  healthStatus: AssetHealth;
  runtimeHours: number;
  lastMaintenanceDate: string;
  nextScheduledMaintenance: string;
  estimatedFailureProbabilityPct: number;
  temperatureCelsius?: number;
  vibrationMms?: number;
  anomalyDetected: boolean;
  anomalyDescription?: string;
  recommendedAction: string;
  daysUntilMaintenance: number;
  healthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

// ---- Scenarios ---------------------------------------------

export interface ScenarioInput {
  name: string;
  loadChangePct: number;
  solarChangePct: number;
  windChangePct: number;
  temperatureChangeCelsius: number;
  fuelAvailabilityPct: number;
  batteryCapacityPct: number;
  generatorsOnline: number;
  durationHours: number;
}

export interface ScenarioResult {
  name: string;
  fuelUsageLiters: number;
  batteryDepletionTime?: string;
  energyShortfallMWh: number;
  renewableContributionPct: number;
  generatorRuntimeHours: number;
  criticalLoadSafe: boolean;
  overallStatus: ScenarioStatus;
  risks: string[];
  summary: string;
}

// ---- System Health -----------------------------------------

export interface ServiceStatus {
  id: string;
  name: string;
  category: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastChecked: string;
  latencyMs?: number;
  message?: string;
  uptimePct: number;
}

// ---- Reports -----------------------------------------------

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';
  lastGenerated?: string;
  availableFormats: ('PDF' | 'CSV' | 'XLSX')[];
}

// ---- Settings ----------------------------------------------

export interface AppSettings {
  theme: 'DARK' | 'LIGHT';
  timezone: string;
  units: {
    power: 'MW' | 'kW';
    energy: 'MWh' | 'kWh';
    temperature: 'C' | 'F';
    fuel: 'L' | 'GALLON';
    wind: 'MS' | 'KMH' | 'KNOTS';
  };
  alertThresholds: {
    fuelLowPct: number;
    batteryLowPct: number;
    batteryReservePct: number;
    generatorHighLoadPct: number;
    maxTemperatureCelsius: number;
  };
  forecastSettings: {
    defaultHorizon: '1h' | '6h' | '24h' | '7d';
    showConfidenceBands: boolean;
    autoRefreshMinutes: number;
  };
  notificationPreferences: {
    criticalAlerts: boolean;
    highAlerts: boolean;
    mediumAlerts: boolean;
    emailAlerts: boolean;
    soundAlerts: boolean;
  };
}

// ---- Decision Log ------------------------------------------

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  recommendationId: string;
  recommendationTitle: string;
  operatorAction: 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
  operatorId: string;
  operatorName: string;
  reason?: string;
  outcomeTimestamp?: string;
  outcome?: string;
  systemStateSnapshot: {
    socPct: number;
    fuelPct: number;
    loadMW: number;
    generationMW: number;
  };
}

// ---- User --------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin: string;
  stationAccess: string[];
}
