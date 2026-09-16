import { create } from 'zustand';
import type { AIRecommendation } from '@/types';
import { aiRecommendations } from '@/mock/aiData';

interface AIState {
  recommendations: AIRecommendation[];
  decisionLog: DecisionLogEntry[];
  acceptRecommendation: (id: string, operatorName: string) => void;
  rejectRecommendation: (id: string, operatorName: string, reason?: string) => void;
}

interface DecisionLogEntry {
  id: string;
  timestamp: string;
  recommendationId: string;
  recommendationTitle: string;
  operatorAction: 'ACCEPTED' | 'REJECTED';
  operatorName: string;
  reason?: string;
  systemState: { socPct: number; fuelPct: number; loadMW: number };
}

export const useAIStore = create<AIState>((set, get) => ({
  recommendations: aiRecommendations,
  decisionLog: [],

  acceptRecommendation: (id, operatorName) => {
    const rec = get().recommendations.find((r) => r.id === id);
    if (!rec) return;
    const entry: DecisionLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recommendationId: id,
      recommendationTitle: rec.title,
      operatorAction: 'ACCEPTED',
      operatorName,
      systemState: { socPct: 74, fuelPct: 68, loadMW: 2.84 },
    };
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'ACCEPTED' as const } : r,
      ),
      decisionLog: [entry, ...state.decisionLog],
    }));
  },

  rejectRecommendation: (id, operatorName, reason) => {
    const rec = get().recommendations.find((r) => r.id === id);
    if (!rec) return;
    const entry: DecisionLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recommendationId: id,
      recommendationTitle: rec.title,
      operatorAction: 'REJECTED',
      operatorName,
      reason,
      systemState: { socPct: 74, fuelPct: 68, loadMW: 2.84 },
    };
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'REJECTED' as const } : r,
      ),
      decisionLog: [entry, ...state.decisionLog],
    }));
  },
}));
