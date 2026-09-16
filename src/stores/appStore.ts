import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DataMode, AppSettings } from '@/types';

interface AppState {
  dataMode: DataMode;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  settings: AppSettings;
  setDataMode: (mode: DataMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  theme: 'DARK',
  timezone: 'UTC',
  units: {
    power: 'MW',
    energy: 'MWh',
    temperature: 'C',
    fuel: 'L',
    wind: 'MS',
  },
  alertThresholds: {
    fuelLowPct: 25,
    batteryLowPct: 20,
    batteryReservePct: 35,
    generatorHighLoadPct: 90,
    maxTemperatureCelsius: 95,
  },
  forecastSettings: {
    defaultHorizon: '24h',
    showConfidenceBands: true,
    autoRefreshMinutes: 5,
  },
  notificationPreferences: {
    criticalAlerts: true,
    highAlerts: true,
    mediumAlerts: true,
    emailAlerts: false,
    soundAlerts: true,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      dataMode: 'DEMO',
      sidebarCollapsed: false,
      theme: 'dark',
      settings: defaultSettings,
      setDataMode: (mode) => set({ dataMode: mode }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    { name: 'polar-app-store', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, settings: s.settings }) },
  ),
);
