import React, { useMemo, useState } from 'react';
import { Fuel as FuelIcon, AlertTriangle, TrendingDown, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fuelRtHours = useMemo(() => fuel ? fuelRuntime(fuel.currentLevelLiters, fuel.consumptionRateLph) : 0, [fuel]);
  const fuelStatus = useMemo(() => fuel ? riskLevel(fuel.levelPercent, 40, 25, 10, true) : 'NORMAL' as const, [fuel]);

  const statusMessage: Record<string, string> = {
    NORMAL: 'Fuel levels are normal',
    WATCH: 'Fuel is getting low — plan resupply',
    WARNING: 'Fuel level is low — resupply needed soon',
    CRITICAL: 'Fuel critically low — immediate resupply required',
  };

  const backupStatus = useMemo(() => {
    if (!fuel) return null;
    if (fuelRtHours > 168) return { label: 'Backup Generator Not Required', color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/20', icon: <CheckCircle2 size={14} /> };
    if (fuelRtHours > 72) return { label: 'Backup Generator Available', color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/20', icon: <CheckCircle2 size={14} /> };
    if (fuelRtHours > 24) return { label: 'Backup Generator — Resupply Recommended', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', icon: <AlertTriangle size={14} /> };
    return { label: 'Backup Generator — Fuel Running Low', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertTriangle size={14} /> };
  }, [fuelRtHours]);

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Backup Fuel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Diesel generator fuel reserve — 50,000 L capacity</p>
        </div>
        {fuelStatus !== 'NORMAL' && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Fuel status: {fuelStatus}</span>
          </div>
        )}
      </div>

      {/* Backup Status Banner */}
      {backupStatus && (
        <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${backupStatus.bg}`}>
          <span className={backupStatus.color}>{backupStatus.icon}</span>
          <div>
            <p className={`text-sm font-semibold ${backupStatus.color}`}>{backupStatus.label}</p>
            {fuel && (
              <p className="text-xs text-slate-500 mt-0.5">
                Estimated {formatFuelRuntime(fuelRtHours)} of backup power available at current consumption rate
              </p>
            )}
          </div>
        </div>
      )}

      {/* Key KPI Row — simplified to 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : fuel ? (
          <>
            <KPICard
              title="Fuel Level"
              value={fuel.levelPercent.toFixed(0)}
              unit="%"
              status={fuelStatus}
              icon={<FuelIcon size={16} />}
              subtitle={statusMessage[fuelStatus]}
            />
            <KPICard
              title="Backup Runtime"
              value={formatFuelRuntime(fuelRtHours)}
              subtitle="Available at current consumption"
            />
            <KPICard
              title="Fuel in Tank"
              value={formatLiters(fuel.currentLevelLiters)}
              subtitle={`of ${formatLiters(fuel.capacityLiters)} total`}
            />
            <KPICard
              title="Next Resupply"
              value={fuel.nextRefillScheduled ? format(new Date(fuel.nextRefillScheduled), 'dd MMM') : 'TBD'}
              subtitle={fuel.nextRefillScheduled ? format(new Date(fuel.nextRefillScheduled), 'HH:mm') : 'Not scheduled'}
            />
          </>
        ) : null}
      </div>

      {/* Tank visual + Forecast chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tank visualization */}
        <Card>
          <CardHeader title="Tank Level" icon={<FuelIcon size={15} />} />
          {fuel ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative w-20 h-48 border-2 border-slate-600/60 rounded-b-2xl overflow-hidden bg-slate-900">
                <div
                  className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${
                    fuelStatus === 'CRITICAL' ? 'bg-red-500/40' : fuelStatus === 'WARNING' ? 'bg-amber-500/40' : 'bg-cyan-500/30'
                  }`}
                  style={{ height: `${fuel.levelPercent}%` }}
                  role="img"
                  aria-label={`Fuel tank: ${fuel.levelPercent.toFixed(1)}% full`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-100">{fuel.levelPercent.toFixed(0)}%</span>
                </div>
                <div className="absolute left-0 right-0 border-t border-dashed border-amber-500/50" style={{ bottom: '25%' }} aria-label="25% warning level" />
                <div className="absolute left-0 right-0 border-t border-dashed border-red-500/50" style={{ bottom: '10%' }} aria-label="10% critical level" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-slate-100">{formatLiters(fuel.currentLevelLiters)}</p>
                <p className="text-xs text-slate-500">of {formatLiters(fuel.capacityLiters)}</p>
              </div>
              <div className="w-full space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>⚠️ Low (warn)</span><span className="text-amber-400">25%</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>🚨 Critical</span><span className="text-red-400">10%</span>
                </div>
              </div>
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
                  <span className="text-slate-500">AI Optimized</span>
                </div>
              </div>
              <FuelLevelChart data={forecastData[0]} height={220} />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { label: 'Current Reserve', value: formatFuelRuntime(fuelRtHours), color: 'text-cyan-400' },
                  { label: 'Forecast Runtime', value: formatFuelRuntime(fuelRtHours * 0.87), color: 'text-amber-400', note: 'At forecast load' },
                  { label: 'AI Optimized', value: formatFuelRuntime(fuelRtHours * 1.18), color: 'text-emerald-400', note: 'With AI plan' },
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

      {/* Fuel Alerts */}
      {fuel && fuel.alerts.length > 0 && (
        <Card>
          <CardHeader title="Fuel Alerts" icon={<AlertTriangle size={15} />} />
          <div className="space-y-2">
            {fuel.alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2.5">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">{a}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Advanced Details (collapsible) */}
      <div className="border border-slate-800/60 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/30 hover:bg-slate-800/30 transition-colors"
          aria-expanded={showAdvanced}
        >
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Advanced Technical Details
          </span>
          {showAdvanced ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </button>
        {showAdvanced && fuel && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Consumption Details</p>
              <div className="space-y-0">
                <DataRow label="Consumption rate" value={`${fuel.consumptionRateLph.toFixed(1)} L/h`} />
                <DataRow label="Daily consumption" value={`${formatLiters(fuel.dailyConsumptionLiters)}/day`} />
                <DataRow label="7-day total" value={formatLiters(fuel.weeklyConsumptionLiters)} />
                <DataRow label="Estimated depletion" value={format(new Date(fuel.estimatedDepletionTime), 'dd MMM HH:mm')} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Resupply History</p>
              <div className="space-y-0">
                <DataRow label="Last refill date" value={format(new Date(fuel.lastRefillTime), 'dd MMM yyyy HH:mm')} />
                <DataRow label="Last refill volume" value={formatLiters(fuel.lastRefillAmount)} />
                <DataRow label="Thresholds" value="Warn: 25% · Critical: 10%" mono={false} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
