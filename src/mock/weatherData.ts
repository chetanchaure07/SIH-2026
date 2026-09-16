import { subHours } from 'date-fns';
import type { WeatherData } from '@/types';

const BASE_TIME = new Date('2026-09-16T05:00:00Z');

export const currentWeather: WeatherData = {
  timestamp: BASE_TIME.toISOString(),
  temperatureCelsius: -18.4,
  feelsLikeCelsius: -26.2,
  windSpeedMs: 9.2,
  windGustMs: 14.5,
  windDirectionDeg: 247,
  precipitationMmh: 0,
  snowfallCmh: 0.4,
  visibilityKm: 8.2,
  pressureHpa: 982.4,
  humidityPercent: 78,
  solarIrradianceWm2: 185,
  cloudCoverPercent: 45,
  uvIndex: 1.2,
  weatherCode: 'PARTLY_CLOUDY',
  weatherDescription: 'Partly cloudy with light snow drift',
  policeWarningLevel: 1,
  energyImpact: {
    heatingLoadIncreaseMW: 0.42,
    solarGenerationImpactPct: -18,
    windGenerationImpactPct: 15,
    overallRiskLevel: 'NORMAL',
    description:
      'Moderate conditions. Partial cloud cover reducing solar by ~18%. Wind boosting generation by 15%. Heating demand elevated due to -18°C ambient temperature.',
  },
};

// 24h weather history (hourly)
export const weatherHistory24h = Array.from({ length: 24 }, (_, i) => ({
  timestamp: subHours(BASE_TIME, 24 - i).toISOString(),
  temperatureCelsius: -18 + Math.sin((i / 24) * Math.PI) * 3,
  windSpeedMs: 8 + (i % 6) * 0.8,
  solarIrradianceWm2: Math.max(0, 200 * Math.sin(((i - 6) / 24) * Math.PI)),
  cloudCoverPercent: 40 + (i % 8) * 5,
  pressureHpa: 982 + (i % 4) - 2,
}));

// 7-day weather forecast
export const weatherForecast7d = [
  {
    date: '2026-09-16',
    minTemp: -21,
    maxTemp: -15,
    windSpeedMs: 9.2,
    cloudCoverPct: 45,
    description: 'Partly cloudy, light snow',
    energyRisk: 'NORMAL' as const,
  },
  {
    date: '2026-09-17',
    minTemp: -24,
    maxTemp: -18,
    windSpeedMs: 13.5,
    cloudCoverPct: 80,
    description: 'Overcast, heavy wind',
    energyRisk: 'WATCH' as const,
  },
  {
    date: '2026-09-18',
    minTemp: -27,
    maxTemp: -22,
    windSpeedMs: 18.2,
    cloudCoverPct: 95,
    description: 'Blizzard conditions expected',
    energyRisk: 'WARNING' as const,
  },
  {
    date: '2026-09-19',
    minTemp: -25,
    maxTemp: -20,
    windSpeedMs: 15.0,
    cloudCoverPct: 85,
    description: 'Continued strong winds',
    energyRisk: 'WATCH' as const,
  },
  {
    date: '2026-09-20',
    minTemp: -20,
    maxTemp: -14,
    windSpeedMs: 10.0,
    cloudCoverPct: 60,
    description: 'Improving conditions',
    energyRisk: 'NORMAL' as const,
  },
  {
    date: '2026-09-21',
    minTemp: -17,
    maxTemp: -11,
    windSpeedMs: 7.5,
    cloudCoverPct: 35,
    description: 'Partly clear, good solar',
    energyRisk: 'NORMAL' as const,
  },
  {
    date: '2026-09-22',
    minTemp: -16,
    maxTemp: -10,
    windSpeedMs: 8.0,
    cloudCoverPct: 30,
    description: 'Mostly clear',
    energyRisk: 'NORMAL' as const,
  },
];
