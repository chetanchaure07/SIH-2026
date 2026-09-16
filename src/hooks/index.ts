import { useAsync } from './useAsync';
import { energyService, fuelService, batteryService, generatorService, loadService, forecastService, weatherService, maintenanceService } from '@/services';
import { useDemoStore } from '@/stores/demoStore';
import { useAppStore } from '@/stores/appStore';

// Energy hooks
export function useEnergySnapshot() {
  const dataMode = useAppStore((s) => s.dataMode);
  const demoSnapshot = useDemoStore((s) => s.energySnapshot);
  const async = useAsync(() => energyService.getCurrentSnapshot());

  if (dataMode === 'DEMO') {
    return { data: demoSnapshot, loading: false, error: null, refetch: () => {} };
  }
  return async;
}

export function useEnergyHistory24h() {
  return useAsync(() => energyService.getHistory24h());
}

export function useEnergyHistory7d() {
  return useAsync(() => energyService.getHistory7d());
}

// Fuel hooks
export function useFuelData() {
  const dataMode = useAppStore((s) => s.dataMode);
  const demoFuelLevel = useDemoStore((s) => s.fuelLevel);
  const demoFuelPct = useDemoStore((s) => s.fuelPct);
  const async = useAsync(() => fuelService.getFuelData());

  if (dataMode === 'DEMO' && async.data) {
    return {
      ...async,
      data: {
        ...async.data,
        currentLevelLiters: demoFuelLevel,
        levelPercent: demoFuelPct,
        timestamp: new Date().toISOString(),
      },
    };
  }
  return async;
}

export function useFuelForecast() {
  return useAsync(() => Promise.all([fuelService.getFuel48hForecast(), fuelService.getOptimizedForecast()]));
}

// Battery hooks
export function useBatteryData() {
  const dataMode = useAppStore((s) => s.dataMode);
  const demoBattery = useDemoStore((s) => s.batteryData);
  const async = useAsync(() => batteryService.getBatteryData());

  if (dataMode === 'DEMO') {
    return { data: demoBattery, loading: false, error: null, refetch: () => {} };
  }
  return async;
}

export function useBatterySOCTimeline() {
  return useAsync(() => batteryService.getSOCTimeline());
}

// Generator hooks
export function useGenerators() {
  return useAsync(() => generatorService.getGenerators());
}

export function useGeneratorSchedule() {
  return useAsync(() => generatorService.getSchedule());
}

// Load hooks
export function useLoadGroups() {
  return useAsync(() => loadService.getLoadGroups());
}

// Forecast hooks
export function useForecast(horizon: '1h' | '6h' | '24h' | '7d') {
  return useAsync(() => forecastService.getForecast(horizon), [horizon]);
}

export function useRenewableForecast() {
  return useAsync(() => forecastService.getRenewableForecast24h());
}

// Weather hooks
export function useWeatherData() {
  return useAsync(() => weatherService.getCurrentWeather());
}

export function useWeatherHistory() {
  return useAsync(() => weatherService.getHistory24h());
}

export function useWeatherForecast7d() {
  return useAsync(() => weatherService.getForecast7d());
}

// Maintenance hooks
export function useMaintenanceData() {
  return useAsync(() => maintenanceService.getAssets());
}
