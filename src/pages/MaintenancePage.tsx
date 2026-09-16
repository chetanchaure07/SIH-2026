import React, { useMemo } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useMaintenanceData } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { HealthBadge, Badge, ProgressBar, DataRow, Skeleton } from '@/components/ui';
import type { AssetMaintenanceRecord, AssetHealth } from '@/types';
import { format } from 'date-fns';

const healthColors: Record<AssetHealth, string> = {
  HEALTHY: 'border-emerald-500/20',
  WATCH: 'border-blue-500/20',
  MAINTENANCE_REQUIRED: 'border-amber-500/30 bg-amber-500/5',
  CRITICAL: 'border-red-500/35 bg-red-500/5',
};

function AssetCard({ asset }: { asset: AssetMaintenanceRecord }) {
  const isUrgent = asset.daysUntilMaintenance <= 0 || asset.healthStatus === 'CRITICAL';
  const isWarn = asset.healthStatus === 'MAINTENANCE_REQUIRED' || asset.daysUntilMaintenance <= 7;
  const healthColor = asset.healthScore >= 85 ? 'green' : asset.healthScore >= 70 ? 'amber' : 'red';

  return (
    <div className={`bg-[#041219] border rounded-xl p-4 space-y-3 ${healthColors[asset.healthStatus]}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">{asset.assetName}</h3>
          <p className="text-xs text-slate-500">{asset.assetType}</p>
        </div>
        <HealthBadge status={asset.healthStatus} />
      </div>

      {/* Health score */}
      <div>
        <ProgressBar value={asset.healthScore} showValue label="Health score" color={healthColor} />
      </div>

      {/* Anomaly warning */}
      {asset.anomalyDetected && (
        <div className="flex items-start gap-1.5 bg-red-500/8 border border-red-500/25 rounded-lg px-2.5 py-2">
          <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-red-400">{asset.anomalyDescription}</p>
        </div>
      )}

      {/* Details */}
      <div className="space-y-0">
        <DataRow label="Runtime" value={`${asset.runtimeHours.toLocaleString()}h total`} />
        {asset.temperatureCelsius !== undefined && (
          <DataRow label="Temperature" value={`${asset.temperatureCelsius.toFixed(1)}°C`} />
        )}
        {asset.vibrationMms !== undefined && (
          <DataRow label="Vibration" value={`${asset.vibrationMms.toFixed(1)} mm/s`} />
        )}
        <DataRow label="Failure risk" value={`${asset.estimatedFailureProbabilityPct}%`} />
        <DataRow label="Last maintenance" value={format(new Date(asset.lastMaintenanceDate), 'dd MMM yyyy')} />
        <DataRow label="Next scheduled" value={format(new Date(asset.nextScheduledMaintenance), 'dd MMM yyyy')} />
        <DataRow label="Days until maint." value={asset.daysUntilMaintenance <= 0 ? `${Math.abs(asset.daysUntilMaintenance)}d overdue` : `${asset.daysUntilMaintenance}d`} />
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={asset.healthTrend === 'IMPROVING' ? 'success' : asset.healthTrend === 'DECLINING' ? 'danger' : 'muted'} size="sm">
          {asset.healthTrend === 'IMPROVING' ? '↑' : asset.healthTrend === 'DECLINING' ? '↓' : '→'} {asset.healthTrend}
        </Badge>
      </div>

      {/* Recommendation */}
      <div className={`rounded-lg px-2.5 py-2 text-xs ${isUrgent ? 'bg-red-500/8 border border-red-500/20 text-red-400' : isWarn ? 'bg-amber-500/8 border border-amber-500/20 text-amber-400' : 'bg-slate-900/50 border border-slate-800/40 text-slate-400'}`}>
        {isUrgent && <AlertTriangle size={11} className="inline mr-1" />}
        {asset.recommendedAction}
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const { data: assets, loading } = useMaintenanceData();

  const urgentCount = assets?.filter((a) => a.daysUntilMaintenance <= 0 || a.healthStatus === 'CRITICAL').length ?? 0;
  const watchCount = assets?.filter((a) => a.healthStatus === 'WATCH' || a.daysUntilMaintenance <= 7).length ?? 0;

  const categorized = useMemo(() => {
    if (!assets) return { urgent: [], watch: [], healthy: [] };
    return {
      urgent: assets.filter((a) => a.daysUntilMaintenance <= 0 || a.healthStatus === 'CRITICAL' || a.healthStatus === 'MAINTENANCE_REQUIRED'),
      watch: assets.filter((a) => a.healthStatus === 'WATCH' && !(a.daysUntilMaintenance <= 0)),
      healthy: assets.filter((a) => a.healthStatus === 'HEALTHY'),
    };
  }, [assets]);

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Predictive Maintenance</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-based asset health monitoring and failure prediction</p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-red-400" aria-hidden="true" />
            <span className="text-xs text-red-400 font-semibold">{urgentCount} asset{urgentCount > 1 ? 's' : ''} require immediate attention</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Assets', count: assets?.length ?? 0, color: 'text-slate-100' },
          { label: 'Healthy', count: assets?.filter((a) => a.healthStatus === 'HEALTHY').length ?? 0, color: 'text-emerald-400' },
          { label: 'Watch', count: assets?.filter((a) => a.healthStatus === 'WATCH').length ?? 0, color: 'text-blue-400' },
          { label: 'Urgent / Overdue', count: urgentCount, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#041219] border border-slate-800/60 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Urgent */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <>
          {categorized.urgent.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Urgent / Maintenance Required ({categorized.urgent.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categorized.urgent.map((a) => <AssetCard key={a.assetId} asset={a} />)}
              </div>
            </div>
          )}

          {categorized.watch.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={13} /> Watch ({categorized.watch.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categorized.watch.map((a) => <AssetCard key={a.assetId} asset={a} />)}
              </div>
            </div>
          )}

          {categorized.healthy.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Healthy ({categorized.healthy.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categorized.healthy.map((a) => <AssetCard key={a.assetId} asset={a} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
