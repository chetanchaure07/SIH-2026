import { create } from 'zustand';
import type { Alert, AlertSeverity, AlertCategory, AlertStatus } from '@/types';
import { alertsData } from '@/mock/alertsData';

interface AlertState {
  alerts: Alert[];
  acknowledgeAlert: (id: string, by: string) => void;
  resolveAlert: (id: string) => void;
  addAlert: (alert: Alert) => void;
  getActiveCount: () => number;
  getCriticalCount: () => number;
  getFilteredAlerts: (filters: {
    severity?: AlertSeverity[];
    category?: AlertCategory[];
    status?: AlertStatus[];
    search?: string;
  }) => Alert[];
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: alertsData,

  acknowledgeAlert: (id, by) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id
          ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString(), acknowledgedBy: by }
          : a,
      ),
    })),

  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : a,
      ),
    })),

  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),

  getActiveCount: () =>
    get().alerts.filter((a) => a.status === 'ACTIVE').length,

  getCriticalCount: () =>
    get().alerts.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length,

  getFilteredAlerts: ({ severity, category, status, search }) => {
    return get().alerts.filter((a) => {
      if (severity?.length && !severity.includes(a.severity)) return false;
      if (category?.length && !category.includes(a.category)) return false;
      if (status?.length && !status.includes(a.status)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },
}));
