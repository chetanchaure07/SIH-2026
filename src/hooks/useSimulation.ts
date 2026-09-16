import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useDemoStore } from '@/stores/demoStore';

const SIMULATION_INTERVAL_MS = 5000; // 5 second ticks

/**
 * Hook that drives the demo simulation engine.
 * Must be mounted once at the application root.
 */
export function useSimulation() {
  const dataMode = useAppStore((s) => s.dataMode);
  const { isRunning, startSimulation, stopSimulation, updateTick } = useDemoStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (dataMode === 'DEMO') {
      startSimulation();
    } else {
      stopSimulation();
    }
  }, [dataMode, startSimulation, stopSimulation]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(updateTick, SIMULATION_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, updateTick]);

  return { isRunning, dataMode };
}
