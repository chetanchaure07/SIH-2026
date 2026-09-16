import React, { useState } from 'react';
import { HeartPulse, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusIndicator, Badge, DataRow } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import type { ServiceStatus } from '@/types';
import { format } from 'date-fns';

const services: ServiceStatus[] = [
  { id: 'data-ingestion', name: 'Data Ingestion', category: 'Core', status: 'ONLINE', lastChecked: '2026-09-16T05:00:00Z', latencyMs: 12, uptimePct: 99.8 },
  { id: 'weather-api', name: 'Weather API', category: 'External', status: 'ONLINE', lastChecked: '2026-09-16T04:58:00Z', latencyMs: 245, uptimePct: 98.2 },
  { id: 'forecast-service', name: 'Forecast Service', category: 'AI', status: 'ONLINE', lastChecked: '2026-09-16T05:00:00Z', latencyMs: 88, uptimePct: 99.1 },
  { id: 'ai-recommendations', name: 'AI Recommendation Engine', category: 'AI', status: 'ONLINE', lastChecked: '2026-09-16T04:55:00Z', latencyMs: 142, uptimePct: 97.5 },
  { id: 'battery-sensors', name: 'Battery Sensor Array', category: 'Sensors', status: 'ONLINE', lastChecked: '2026-09-16T04:59:00Z', latencyMs: 8, uptimePct: 99.9 },
  { id: 'solar-sensors', name: 'Solar PV Telemetry', category: 'Sensors', status: 'ONLINE', lastChecked: '2026-09-16T04:59:00Z', latencyMs: 6, uptimePct: 99.7 },
  { id: 'wind-t1', name: 'Wind Turbine T1 Sensor', category: 'Sensors', status: 'ONLINE', lastChecked: '2026-09-16T04:59:30Z', latencyMs: 7, uptimePct: 99.9 },
  { id: 'wind-t2', name: 'Wind Turbine T2 Sensor', category: 'Sensors', status: 'OFFLINE', lastChecked: '2026-09-16T04:52:00Z', message: 'Sensor unresponsive — possible ice accumulation', uptimePct: 96.2 },
  { id: 'gen-01-controller', name: 'Generator G-01 Controller', category: 'Control', status: 'ONLINE', lastChecked: '2026-09-16T05:00:00Z', latencyMs: 4, uptimePct: 99.9 },
  { id: 'gen-02-controller', name: 'Generator G-02 Controller', category: 'Control', status: 'ONLINE', lastChecked: '2026-09-16T05:00:00Z', latencyMs: 5, uptimePct: 99.8 },
  { id: 'gen-03-controller', name: 'Generator G-03 Controller', category: 'Control', status: 'ONLINE', lastChecked: '2026-09-16T04:59:00Z', latencyMs: 5, uptimePct: 99.0 },
  { id: 'database', name: 'Time-Series Database', category: 'Infrastructure', status: 'ONLINE', lastChecked: '2026-09-16T05:00:00Z', latencyMs: 18, uptimePct: 99.95 },
  { id: 'edge-compute', name: 'Edge Compute Node', category: 'Infrastructure', status: 'DEGRADED', lastChecked: '2026-09-16T04:57:00Z', latencyMs: 890, message: 'High CPU usage — processing backlog', uptimePct: 98.1 },
  { id: 'satellite-link', name: 'Satellite Communication Link', category: 'Network', status: 'ONLINE', lastChecked: '2026-09-16T04:58:00Z', latencyMs: 820, uptimePct: 94.3 },
  { id: 'local-network', name: 'Station Local Network', category: 'Network', status: 'ONLINE', lastChecked: '2026-09-16T05:00:00Z', latencyMs: 2, uptimePct: 99.99 },
];

const categoryOrder = ['Core', 'AI', 'Sensors', 'Control', 'Infrastructure', 'Network', 'External'];

export default function HealthPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const offlineCount = services.filter((s) => s.status === 'OFFLINE').length;
  const degradedCount = services.filter((s) => s.status === 'DEGRADED').length;

  const grouped: Record<string, ServiceStatus[]> = {};
  services.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  return (
    <div className="p-5 space-y-5 max-w-[1100px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">System Health</h1>
          <p className="text-xs text-slate-500 mt-0.5">Service and sensor connectivity monitoring</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={() => setLastRefresh(new Date())}>
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Services', count: services.length, color: 'text-slate-100' },
          { label: 'Online', count: services.filter((s) => s.status === 'ONLINE').length, color: 'text-emerald-400' },
          { label: 'Degraded', count: degradedCount, color: 'text-amber-400' },
          { label: 'Offline', count: offlineCount, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#041219] border border-slate-800/60 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Issues banner */}
      {(offlineCount > 0 || degradedCount > 0) && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-2.5">
          <AlertTriangle size={14} className="text-amber-400" aria-hidden="true" />
          <span className="text-xs text-amber-400">
            {offlineCount > 0 && `${offlineCount} service${offlineCount > 1 ? 's' : ''} offline`}
            {offlineCount > 0 && degradedCount > 0 && ' — '}
            {degradedCount > 0 && `${degradedCount} service${degradedCount > 1 ? 's' : ''} degraded`}
          </span>
        </div>
      )}

      {/* Last refresh */}
      <p className="text-xs text-slate-600">
        Last checked: {format(lastRefresh, 'HH:mm:ss')}
      </p>

      {/* Service groups */}
      <div className="space-y-4">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          return (
            <Card key={cat}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h2>
              <div className="space-y-2">
                {items.map((svc) => (
                  <div key={svc.id} className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border ${svc.status === 'OFFLINE' ? 'border-red-500/25 bg-red-500/5' : svc.status === 'DEGRADED' ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-800/30'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIndicator status={svc.status} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{svc.name}</p>
                        {svc.message && (
                          <p className="text-[11px] text-amber-400 truncate">{svc.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                      {svc.latencyMs && <span className="font-mono">{svc.latencyMs}ms</span>}
                      <span className="font-mono">{svc.uptimePct}%</span>
                      <span className="text-[10px] hidden md:block">{format(new Date(svc.lastChecked), 'HH:mm')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
