import { create } from 'zustand';
import { lerp } from '@/utils/calculations';
import type { EnergySnapshot, BatteryData } from '@/types';
import { currentEnergySnapshot } from '@/mock/energyData';
import { batteryData as initialBattery } from '@/mock/batteryData';

interface DemoState {
  isRunning: boolean;
  tick: number;
  energySnapshot: EnergySnapshot;
  batteryData: BatteryData;
  fuelLevel: number; // liters
  fuelPct: number;
  startSimulation: () => void;
  stopSimulation: () => void;
  updateTick: () => void;
}

// Deterministic oscillation — smooth waves, no randomness
function oscillate(tick: number, base: number, amplitude: number, period: number): number {
  return base + amplitude * Math.sin((tick / period) * Math.PI * 2);
}

export const useDemoStore = create<DemoState>((set, get) => ({
  isRunning: false,
  tick: 0,
  energySnapshot: currentEnergySnapshot,
  batteryData: initialBattery,
  fuelLevel: 34000,
  fuelPct: 68.0,

  startSimulation: () => set({ isRunning: true }),
  stopSimulation: () => set({ isRunning: false }),

  updateTick: () => {
    const { tick, fuelLevel } = get();
    const newTick = tick + 1;

    // Smooth deterministic simulation — no random jumps
    const load = oscillate(newTick, 2.84, 0.18, 30);
    const solarGen = Math.max(0, oscillate(newTick, 0.48, 0.15, 60));
    const windGen = oscillate(newTick, 0.64, 0.12, 20);
    const renewableGen = solarGen + windGen;
    const genOutput = Math.max(0, load - renewableGen - 0.2);
    const batteryOutput = load - renewableGen - genOutput;
    const newFuelLevel = fuelLevel - (genOutput * 0.9 * 87.4) / 360; // approximate per tick
    const newFuelPct = (newFuelLevel / 50000) * 100;

    // Battery SOC — smooth discharge/charge
    const currentSoc = get().batteryData.socPercent;
    const targetSoc = batteryOutput > 0 ? currentSoc - 0.05 : currentSoc + 0.03;
    const newSoc = lerp(currentSoc, targetSoc, 0.3);

    set({
      tick: newTick,
      energySnapshot: {
        ...currentEnergySnapshot,
        timestamp: new Date().toISOString(),
        totalLoadMW: load,
        totalGenerationMW: renewableGen + genOutput,
        renewableGenerationMW: renewableGen,
        solarGenerationMW: solarGen,
        windGenerationMW: windGen,
        generatorOutputMW: genOutput,
        batteryOutputMW: batteryOutput,
        renewableContributionPct: (renewableGen / load) * 100,
        powerBalance: renewableGen + genOutput - load,
      },
      batteryData: {
        ...initialBattery,
        timestamp: new Date().toISOString(),
        socPercent: Math.max(0, Math.min(100, newSoc)),
        currentPowerMW: batteryOutput,
        availableEnergyMWh: (newSoc / 100) * 18.64,
        mode: batteryOutput > 0.05 ? 'DISCHARGING' : batteryOutput < -0.05 ? 'CHARGING' : 'IDLE',
      },
      fuelLevel: Math.max(0, newFuelLevel),
      fuelPct: Math.max(0, newFuelPct),
    });
  },
}));
