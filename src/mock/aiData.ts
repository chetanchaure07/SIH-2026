import type { AIRecommendation, AIModelInfo } from '@/types';

export const aiRecommendations: AIRecommendation[] = [
  {
    id: 'REC-001',
    generatedAt: '2026-09-16T04:50:00Z',
    expiresAt: '2026-09-16T11:00:00Z',
    priority: 'HIGH',
    category: 'Battery Management',
    title: 'Increase battery charge target to 85% before blizzard',
    description:
      'Pre-charge the battery storage system to ≥85% SOC by September 18 06:00 UTC to ensure adequate energy reserve during forecast blizzard conditions.',
    reason:
      'Meteorological forecast predicts 80–95% solar generation loss and significant heating load increase during the blizzard event. Battery reserve provides critical load backup.',
    expectedImpact:
      'Maintains critical load capacity for 14+ hours without generator support. Reduces dependency on G-03 (currently under-maintained).',
    confidence: 88,
    affectedSystems: ['Battery Storage', 'Generator G-02', 'Solar PV System'],
    timeSensitivity: 'SOON',
    status: 'PENDING',
    actionAcceptLabel: 'Schedule charging',
    actionRejectLabel: 'Dismiss',
    modelVersion: 'EnergyForecast-v1.2',
    factors: [
      {
        name: 'Blizzard forecast probability',
        contribution: 45,
        direction: 'NEGATIVE',
        description: '82% probability of blizzard conditions Sept 18',
      },
      {
        name: 'Current battery SOC',
        contribution: 25,
        direction: 'NEUTRAL',
        description: 'SOC at 74% — adequate but not optimal for extended backup',
      },
      {
        name: 'Heating load forecast',
        contribution: 20,
        direction: 'NEGATIVE',
        description: 'Expected +0.6 MW heating load increase during blizzard',
      },
      {
        name: 'G-03 maintenance status',
        contribution: 10,
        direction: 'NEGATIVE',
        description: 'G-03 not reliable for emergency dispatch without maintenance',
      },
    ],
  },
  {
    id: 'REC-002',
    generatedAt: '2026-09-16T04:50:00Z',
    expiresAt: '2026-09-16T14:00:00Z',
    priority: 'HIGH',
    category: 'Generator Management',
    title: 'Schedule G-03 maintenance before Sept 18',
    description:
      'Prioritize maintenance inspection of Generator G-03 (Cummins QSK60) within the next 36 hours to ensure it can serve as emergency backup during the blizzard.',
    reason:
      'G-03 has missed its scheduled maintenance by 4 days. Health score has declined from 85 to 79. The upcoming blizzard may require emergency dispatch of G-03.',
    expectedImpact:
      'Restores G-03 health score to ~90+. Reduces failure probability from 12% to <3% during the critical weather event.',
    confidence: 91,
    affectedSystems: ['Generator G-03', 'Fuel System'],
    timeSensitivity: 'SOON',
    status: 'PENDING',
    actionAcceptLabel: 'Schedule maintenance',
    actionRejectLabel: 'Accept risk',
    modelVersion: 'MaintenancePredictor-v2.1',
    factors: [
      {
        name: 'Maintenance overdue days',
        contribution: 40,
        direction: 'NEGATIVE',
        description: '4 days past scheduled maintenance',
      },
      {
        name: 'Health score trend',
        contribution: 30,
        direction: 'NEGATIVE',
        description: 'Declining trend: 85 → 79 over 2 weeks',
      },
      {
        name: 'Upcoming weather event',
        contribution: 30,
        direction: 'NEGATIVE',
        description: 'High probability of needing emergency capacity',
      },
    ],
  },
  {
    id: 'REC-003',
    generatedAt: '2026-09-16T04:50:00Z',
    expiresAt: '2026-09-17T05:00:00Z',
    priority: 'MEDIUM',
    category: 'Load Management',
    title: 'Defer non-critical loads during peak hours 14:00–18:00',
    description:
      'Reduce non-critical load consumption by approximately 20% during the afternoon peak window to optimize battery charge rate.',
    reason:
      'Load forecast shows peak demand of 3.15 MW between 14:00–18:00 UTC today. Reducing non-critical loads allows faster battery charging using surplus renewable generation.',
    expectedImpact:
      'Battery SOC improves by approximately 6% by 18:00. Reduces generator load by 0.3 MW during peak.',
    confidence: 76,
    affectedSystems: ['Non-Critical Loads', 'Battery Storage', 'Generator G-01'],
    timeSensitivity: 'PLANNED',
    status: 'PENDING',
    actionAcceptLabel: 'Apply load reduction',
    actionRejectLabel: 'Keep current schedule',
    modelVersion: 'EnergyForecast-v1.2',
    factors: [
      {
        name: 'Afternoon load forecast',
        contribution: 50,
        direction: 'NEGATIVE',
        description: 'Peak demand 3.15 MW at 14:00–16:00',
      },
      {
        name: 'Battery charge opportunity',
        contribution: 30,
        direction: 'POSITIVE',
        description: 'Wind generation stable at ~0.64 MW during window',
      },
      {
        name: 'Blizzard preparation',
        contribution: 20,
        direction: 'POSITIVE',
        description: 'Extra buffer before weather event',
      },
    ],
  },
  {
    id: 'REC-004',
    generatedAt: '2026-09-16T04:50:00Z',
    expiresAt: '2026-09-16T08:00:00Z',
    priority: 'LOW',
    category: 'System Maintenance',
    title: 'Investigate wind turbine sensor W-T2',
    description:
      'Dispatch technician to inspect Wind Turbine #2 sensor housing for ice accumulation or connection failure.',
    reason:
      'W-T2 telemetry has been offline for 8 minutes. Physical inspection is necessary to rule out structural or electrical issues beyond sensor icing.',
    expectedImpact:
      'Restores accurate wind generation data. Reduces forecast uncertainty from MEDIUM to HIGH confidence.',
    confidence: 94,
    affectedSystems: ['Wind Turbine T2', 'Weather Station', 'Renewable Forecast'],
    timeSensitivity: 'IMMEDIATE',
    status: 'PENDING',
    actionAcceptLabel: 'Dispatch technician',
    actionRejectLabel: 'Monitor and wait',
    modelVersion: 'AssetMonitor-v1.0',
    factors: [
      {
        name: 'Sensor offline duration',
        contribution: 60,
        direction: 'NEGATIVE',
        description: '8 minutes unresponsive — beyond normal restart window',
      },
      {
        name: 'Ambient temperature',
        contribution: 40,
        direction: 'NEGATIVE',
        description: '-18°C with snowfall — ice accumulation likely',
      },
    ],
  },
];

export const aiModelInfo: AIModelInfo = {
  name: 'Polar EnergyAI',
  version: '1.2',
  lastTrained: '2026-09-10T00:00:00Z',
  dataCoveragedays: 30,
  predictionHorizonHours: 168,
  overallConfidence: 87,
  accuracy7d: 91.4,
};
