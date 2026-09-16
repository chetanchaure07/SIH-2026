import type { Alert } from '@/types';

export const alertsData: Alert[] = [
  {
    id: 'ALT-001',
    timestamp: '2026-09-16T03:42:00Z',
    severity: 'HIGH',
    category: 'WEATHER',
    source: 'Weather Monitoring System',
    title: 'Blizzard Warning — Sept 18',
    description:
      'Meteorological forecast predicts blizzard conditions starting Sept 18 at 06:00 UTC with wind speeds exceeding 18 m/s and visibility below 200m.',
    impact:
      'Expected 80–95% reduction in solar generation. Elevated heating load (+0.6 MW). Potential operational restrictions.',
    suggestedAction:
      'Pre-charge battery to ≥85% SOC before Sept 18. Ensure fuel reserve above 60%. Verify generator G-03 readiness.',
    status: 'ACTIVE',
  },
  {
    id: 'ALT-002',
    timestamp: '2026-09-16T04:15:00Z',
    severity: 'MEDIUM',
    category: 'GENERATOR',
    source: 'Predictive Maintenance AI',
    title: 'Generator G-03 Maintenance Overdue',
    description:
      'Generator G-03 (Cummins QSK60) scheduled maintenance was due 2026-09-12. Unit has been in standby but health score has dropped from 85 to 79.',
    impact:
      'If G-03 is needed during the forecast blizzard, reduced reliability is possible. Failure probability: 12%.',
    suggestedAction:
      'Schedule maintenance within 48 hours. Do not use G-03 as primary unit until inspected.',
    status: 'ACTIVE',
  },
  {
    id: 'ALT-003',
    timestamp: '2026-09-16T01:00:00Z',
    severity: 'INFO',
    category: 'ENERGY',
    source: 'Energy Management System',
    title: 'Renewable contribution below target',
    description:
      'Solar generation has been 18% below forecast for the past 6 hours due to partial cloud cover.',
    impact:
      'Generator runtime increased by ~1.2 hours. Additional fuel consumption: ~105 liters.',
    suggestedAction: 'No immediate action required. Monitor cloud cover forecast.',
    status: 'ACKNOWLEDGED',
    acknowledgedAt: '2026-09-16T01:30:00Z',
    acknowledgedBy: 'Operator Chen',
  },
  {
    id: 'ALT-004',
    timestamp: '2026-09-15T20:00:00Z',
    severity: 'LOW',
    category: 'BATTERY',
    source: 'Battery Management System',
    title: 'Battery operating near lower thermal limit',
    description:
      'Battery pack temperature has been -8.4°C for 12 hours. Rated operating range is -10°C to +40°C.',
    impact: 'Charging efficiency reduced by ~6%. Available capacity slightly reduced.',
    suggestedAction:
      'Monitor temperature. If ambient temperature drops further, activate battery thermal management.',
    status: 'ACKNOWLEDGED',
    acknowledgedAt: '2026-09-15T20:45:00Z',
    acknowledgedBy: 'Engineer Patel',
  },
  {
    id: 'ALT-005',
    timestamp: '2026-09-15T14:30:00Z',
    severity: 'MEDIUM',
    category: 'FUEL',
    source: 'Fuel Management System',
    title: 'Fuel consumption rate elevated',
    description:
      'Fuel consumption rate is 12% above the 7-day rolling average. Current: 87.4 L/h, Average: 78.0 L/h.',
    impact: 'Fuel reserve depletion 2.1 days earlier than standard plan if rate continues.',
    suggestedAction:
      'Review generator load optimization. Confirm next fuel delivery schedule.',
    status: 'RESOLVED',
    acknowledgedAt: '2026-09-15T15:00:00Z',
    resolvedAt: '2026-09-15T18:00:00Z',
  },
  {
    id: 'ALT-006',
    timestamp: '2026-09-16T05:00:00Z',
    severity: 'CRITICAL',
    category: 'SYSTEM',
    source: 'System Health Monitor',
    title: 'Wind turbine sensor W-T2 offline',
    description:
      'Wind turbine #2 telemetry sensor has been unresponsive for 8 minutes. Generation data from W-T2 is estimated.',
    impact:
      'Wind generation readings for T2 are estimated from T1 correlation. Data reliability reduced.',
    suggestedAction:
      'Dispatch technician to inspect W-T2 sensor connection. Check for ice accumulation on sensor housing.',
    status: 'ACTIVE',
  },
];
