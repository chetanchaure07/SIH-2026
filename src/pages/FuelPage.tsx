import React, { useMemo } from 'react';
import { Fuel as FuelIcon, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import { useFuelData, useFuelForecast } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { ProgressBar, DataRow, Skeleton, Badge } from '@/components/ui';
import { FuelLevelChart } from '@/charts';
import { fuelRuntime, formatFuelRuntime, formatLiters, riskLevel } from '@/utils/calculations';
import { format } from 'date-fns';

export default function FuelPage() {
  const { data: fuel, loading } = useFuelData();
  const { data: forecastData } = useFuelForecast();

  const fuelRtHours = useMemo(() => fuel ? fuelRuntime(fuel.currentLevelLiters, fuel.consumptionRateLph) : 0, [fuel]);
  const fuelStatus = useMemo(() => fuel ? riskLevel(fuel.levelPercent, 40, 25, 10, true) : 'NORMAL' as const, [fuel]);

  const forecastAllPoints = useMemo(() => {
    if (!forecastData) return [];
    const [base, optimized] = forecastData;
    return [...base, ...optimized];
  }, [forecastData]);

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Fuel Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">50,000 L tank capacity — Primary diesel reserve</p>
        </div>
        {fuelStatus !== 'NORMAL' && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Fuel status: {fuelStatus}</span>
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : fuel ? (
          <>
            <KPICard title="Fuel Level" value={fuel.levelPercent.toFixed(1)} unit="%" status={fuelStatus} icon={<FuelIcon size={16} />} subtitle={formatLiters(fuel.currentLevelLiters)} />
            <KPICard title="Estimated Runtime" value={formatFuelRuntime(fuelRtHours)} subtitle="At current consumption rate" icon={<Calendar size={16} />} />
            <KPICard title="Consumption Rate" value={fuel.consumptionRateLph.toFixed(1)} unit="L/h" subtitle={`${(fuel.consumptionRateLph * 24).toFixed(0)} L/day`} />
            <KPICard title="Daily Consumption" value={formatLiters(fuel.dailyConsumptionLiters)} subtitle="24-hour period" />
            <KPICard title="Tank Capacity" value={formatLiters(fuel.capacityLiters)} subtitle="Total tank volume" />
            <KPICard title="Weekly Consumption" value={formatLiters(fuel.weeklyConsumptionLiters)} subtitle="Last 7 days" />
            <KPICard title="Last Refill" value={format(new Date(fuel.lastRefillTime), 'dd MMM')} subtitle={`${formatLiters(fuel.lastRefillAmount)} delivered`} />
            <KPICard title="Next Refill" value={fuel.nextRefillScheduled ? format(new Date(fuel.nextRefillScheduled), 'dd MMM HH:mm') : 'TBD'} subtitle="Scheduled resupply" />
          </>
        ) : null}
      </div>

      {/* Fuel level visual + chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Visual tank */}
        <Card>
          <CardHeader title="Tank Level" icon={<FuelIcon size={15} />} />
          {fuel ? (
            <div className="flex flex-col items-center gap-4 py-4">
              {/* Tank visualization */}
              <div className="relative w-20 h-48 border-2 border-slate-600/60 rounded-b-2xl overflow-hidden bg-slate-900">
                <div
                  className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${fuelStatus === 'CRITICAL' ? 'bg-red-500/40' : fuelStatus === 'WARNING' ? 'bg-amber-500/40' : 'bg-cyan-500/30'}`}
                  style={{ height: `${fuel.levelPercent}%` }}
                  role="img"
                  aria-label={`Fuel tank: ${fuel.levelPercent.toFixed(1)}% full`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-data text-slate-100">{fuel.levelPercent.toFixed(0)}%</span>
                </div>
                {/* Warning lines */}
                <div className="absolute left-0 right-0 border-t border-dashed border-amber-500/50" style={{ bottom: '25%' }} aria-label="25% warning threshold" />
                <div className="absolute left-0 right-0 border-t border-dashed border-red-500/50" style={{ bottom: '10%' }} aria-label="10% critical threshold" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-slate-100">{formatLiters(fuel.currentLevelLiters)}</p>
                <p className="text-xs text-slate-500">of {formatLiters(fuel.capacityLiters)}</p>
              </div>
              <ProgressBar value={fuel.levelPercent} showValue color="cyan" size="md" />
            </div>
          ) : <Skeleton className="h-72" />}
        </Card>

        {/* Forecast chart */}
        <Card className="md:col-span-2">
          <CardHeader
            title="Fuel Level Forecast"
            subtitle="48-hour projection"
            icon={<TrendingDown size={15} />}
            actions={<Badge variant="warning" size="sm">FORECAST</Badge>}
          />
          {forecastData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block rounded" />
                  <span className="text-slate-500">Observed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block rounded border-dashed" />
                  <span className="text-slate-500">Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block rounded" />
                  <span className="text-slate-500">Optimized</span>
                </div>
              </div>
              <FuelLevelChart data={forecastData[0]} height={220} />
              {/* Runtime comparison */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { label: 'Current Reserve', value: formatFuelRuntime(fuelRtHours), color: 'text-cyan-400' },
                  { label: 'At Current Load', value: formatFuelRuntime(fuelRtHours * 0.87), color: 'text-amber-400', note: 'Forecast' },
                  { label: 'Optimized', value: formatFuelRuntime(fuelRtHours * 1.18), color: 'text-emerald-400', note: 'AI plan' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-slate-500">{item.label}</p>
                    {item.note && <p className="text-[10px] text-slate-600">{item.note}</p>}
                    <p className={`text-sm font-bold font-mono mt-1 ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : <Skeleton className="h-64" />}
        </Card>
      </div>

      {/* Alerts + Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Fuel Details" icon={<FuelIcon size={15} />} />
          {fuel ? (
            <div className="space-y-0">
              <DataRow label="Current level" value={`${formatLiters(fuel.currentLevelLiters)} (${fuel.levelPercent.toFixed(1)}%)`} />
              <DataRow label="Consumption rate" value={`${fuel.consumptionRateLph.toFixed(1)} L/h`} />
              <DataRow label="Daily consumption" value={`${formatLiters(fuel.dailyConsumptionLiters)}/day`} />
              <DataRow label="7-day total" value={formatLiters(fuel.weeklyConsumptionLiters)} />
              <DataRow label="Estimated depletion" value={format(new Date(fuel.estimatedDepletionTime), 'dd MMM HH:mm')} />
              <DataRow label="Last refill date" value={format(new Date(fuel.lastRefillTime), 'dd MMM yyyy HH:mm')} />
              <DataRow label="Last refill volume" value={formatLiters(fuel.lastRefillAmount)} />
            </div>
          ) : <Skeleton className="h-40" />}
        </Card>

        <Card>
          <CardHeader title="Thresholds & Alerts" icon={<AlertTriangle size={15} />} />
          <div className="space-y-3">
            {[
              { label: 'Warning threshold', pct: 25, color: 'amber' as const },
              { label: 'Critical threshold', pct: 10, color: 'red' as const },
            ].map((t) => (
              <div key={t.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{t.label}</span>
                  <span className="font-mono text-slate-300">{t.pct}%</span>
                </div>
                <ProgressBar value={t.pct} color={t.color} size="xs" />
              </div>
            ))}
            <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3 mt-2">
              <p className="text-xs text-slate-400 mb-2 font-semibold">Fuel Alerts</p>
              {fuel?.alerts.length === 0 ? (
                <p className="text-xs text-slate-600">No active fuel alerts</p>
              ) : fuel?.alerts.map((a, i) => (
                <p key={i} className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={11} /> {a}
                </p>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
