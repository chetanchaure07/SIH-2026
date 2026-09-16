import React, { useMemo } from 'react';
import { Battery as BatteryIcon, Thermometer, Zap, AlertTriangle } from 'lucide-react';
import { useBatteryData, useBatterySOCTimeline } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge, ProgressBar, DataRow, Skeleton } from '@/components/ui';
import { SOCChart, Sparkline } from '@/charts';
import { KPICard } from '@/components/ui/KPICard';
import { riskLevel, formatMWh, formatPct } from '@/utils/calculations';
import { format } from 'date-fns';

export default function BatteryPage() {
  const { data: battery, loading } = useBatteryData();
  const { data: timeline } = useBatterySOCTimeline();

  const batteryStatus = useMemo(() => {
    if (!battery) return 'NORMAL' as const;
    return riskLevel(battery.socPercent, 40, 25, 15, true);
  }, [battery]);

  const tempColor = useMemo(() => {
    if (!battery) return 'cyan';
    if (battery.temperatureCelsius < -10) return 'red';
    if (battery.temperatureCelsius < -5) return 'amber';
    return 'cyan';
  }, [battery]);

  const sparkData = useMemo(() => timeline?.map((p) => p.socPercent) ?? [], [timeline]);

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Battery & Energy Storage</h1>
        <p className="text-xs text-slate-500 mt-0.5">Lithium-ion storage bank — 20 MWh capacity</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : battery ? (
          <>
            <KPICard title="State of Charge" value={battery.socPercent.toFixed(1)} unit="%" status={batteryStatus} icon={<BatteryIcon size={16} />} />
            <KPICard title="State of Health" value={battery.sohPercent.toFixed(1)} unit="%" icon={<BatteryIcon size={16} />} status={battery.sohPercent < 80 ? 'WARNING' : 'NORMAL'} />
            <KPICard title="Available Energy" value={formatMWh(battery.availableEnergyMWh)} subtitle={`of ${formatMWh(battery.usableCapacityMWh)} usable`} />
            <KPICard title="Current Power" value={battery.currentPowerMW.toFixed(2)} unit="MW" subtitle={battery.mode} status={battery.mode === 'FAULT' ? 'CRITICAL' : 'NORMAL'} />
            <KPICard title="Temperature" value={battery.temperatureCelsius.toFixed(1)} unit="°C" warning={battery.temperatureCelsius < -8 ? 'Near lower thermal limit (-10°C)' : undefined} icon={<Thermometer size={16} />} />
            <KPICard title="Charge Rate" value={battery.chargeRateMW.toFixed(1)} unit="MW max" />
            <KPICard title="Discharge Rate" value={battery.dischargeRateMW.toFixed(1)} unit="MW max" />
            <KPICard title="Cycle Count" value={battery.cycleCount} subtitle="Total charge/discharge cycles" />
          </>
        ) : null}
      </div>

      {/* SOC gauge + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SOC Large Display */}
        <Card>
          <CardHeader title="State of Charge" icon={<BatteryIcon size={15} />} />
          {battery ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#0a2233" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="48" fill="none"
                    stroke={battery.socPercent < 25 ? '#ef4444' : battery.socPercent < 40 ? '#f59e0b' : '#818cf8'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(battery.socPercent / 100) * 301.6} 301.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono text-slate-100">{battery.socPercent.toFixed(0)}%</span>
                  <span className="text-[10px] text-slate-500">SOC</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                <DataRow label="Available energy" value={`${battery.availableEnergyMWh.toFixed(1)} MWh`} />
                <DataRow label="Mode" value={battery.mode} mono={false} />
                <DataRow label="Power" value={`${battery.currentPowerMW.toFixed(2)} MW`} />
                <DataRow label="Temperature" value={`${battery.temperatureCelsius.toFixed(1)}°C`} />
                <DataRow label="Estimated runtime" value={`${battery.estimatedRuntimeHours.toFixed(0)}h`} />
              </div>
            </div>
          ) : <Skeleton className="h-64 rounded-xl" />}
        </Card>

        {/* SOC Timeline */}
        <Card className="md:col-span-2">
          <CardHeader
            title="SOC Timeline"
            subtitle="Last 12h (actual) + Next 12h (forecast)"
            icon={<Zap size={15} />}
          />
          <div className="mb-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-violet-400 inline-block" />
              <span className="text-slate-500">Historical</span>
            </div>
            <Badge variant="warning" size="sm">Forecast after NOW</Badge>
          </div>
          {timeline ? (
            <SOCChart data={timeline} height={240} />
          ) : <Skeleton className="h-60 rounded-xl" />}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-2 text-center">
              <p className="text-slate-500">Current</p>
              <p className="font-mono font-bold text-violet-400">{battery?.socPercent.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-2 text-center">
              <p className="text-slate-500">12h Target</p>
              <p className="font-mono font-bold text-slate-300">73.0%</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-2 text-center">
              <p className="text-slate-500">Reserve Min</p>
              <p className="font-mono font-bold text-amber-400">35.0%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Health Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Battery Specifications" icon={<BatteryIcon size={15} />} />
          {battery ? (
            <div className="space-y-0">
              <DataRow label="Total capacity" value={`${battery.capacityMWh.toFixed(1)} MWh`} />
              <DataRow label="Usable capacity" value={`${battery.usableCapacityMWh.toFixed(1)} MWh`} />
              <DataRow label="State of health" value={`${battery.sohPercent.toFixed(1)}%`} />
              <DataRow label="Max charge rate" value={`${battery.chargeRateMW.toFixed(1)} MW`} />
              <DataRow label="Max discharge rate" value={`${battery.dischargeRateMW.toFixed(1)} MW`} />
              <DataRow label="Total cycles" value={battery.cycleCount.toString()} />
              <DataRow label="Operating temp." value={`${battery.temperatureCelsius.toFixed(1)}°C`} />
            </div>
          ) : <Skeleton className="h-40" />}
        </Card>

        <Card>
          <CardHeader title="Recommendations" icon={<AlertTriangle size={15} />} />
          <div className="space-y-2">
            {battery?.temperatureCelsius < -8 && (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 text-xs">
                <p className="font-semibold text-amber-400 mb-1">Temperature Warning</p>
                <p className="text-slate-400">Battery temperature {battery.temperatureCelsius.toFixed(1)}°C is near the lower operating limit of -10°C. Consider activating thermal management.</p>
              </div>
            )}
            <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-3 text-xs">
              <p className="font-semibold text-blue-400 mb-1">Pre-Storm Preparation</p>
              <p className="text-slate-400">AI recommends charging battery to ≥85% SOC before Sept 18 blizzard. Current plan achieves 68% by that time.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3 text-xs">
              <p className="font-semibold text-slate-300 mb-1">Reserve Target</p>
              <p className="text-slate-400">Maintain minimum 35% SOC (7.0 MWh) for critical load coverage during extended generator outage.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
