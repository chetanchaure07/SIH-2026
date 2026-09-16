import React, { useMemo } from 'react';
import { Wind, Sun, BarChart2, Zap } from 'lucide-react';
import { useWeatherData, useRenewableForecast } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Badge, DataRow, Skeleton, ProgressBar } from '@/components/ui';
import { RenewableChart, EnergyHistoryChart } from '@/charts';
import { windDirectionLabel, formatWindSpeed } from '@/utils/calculations';
import { renewableForecast24h } from '@/mock/forecastData';

export default function RenewablesPage() {
  const { data: weather } = useWeatherData();
  const { data: renewForecast } = useRenewableForecast();

  const currentSolar = renewForecast?.[0]?.solar ?? 0.48;
  const currentWind = renewForecast?.[0]?.wind ?? 0.64;
  const totalRenewable = currentSolar + currentWind;

  // Simple sparkline data from forecast
  const solarSpark = useMemo(() => renewForecast?.map((p) => p.solar) ?? [], [renewForecast]);
  const windSpark = useMemo(() => renewForecast?.map((p) => p.wind) ?? [], [renewForecast]);

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Renewable Energy</h1>
        <p className="text-xs text-slate-500 mt-0.5">Solar PV + Wind Turbine system — 2.0 MW total capacity</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Total Renewable" value={totalRenewable.toFixed(2)} unit="MW" subtitle="Current generation" icon={<Zap size={16} />} />
        <KPICard title="Solar" value={currentSolar.toFixed(2)} unit="MW" subtitle={`${((currentSolar / 1.0) * 100).toFixed(0)}% of solar capacity`} icon={<Sun size={16} />} />
        <KPICard title="Wind" value={currentWind.toFixed(2)} unit="MW" subtitle={`${((currentWind / 1.0) * 100).toFixed(0)}% of wind capacity`} icon={<Wind size={16} />} />
        <KPICard title="Capacity Factor" value={((totalRenewable / 2.0) * 100).toFixed(1)} unit="%" subtitle="Renewable utilization" />
      </div>

      {/* Solar + Wind details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solar */}
        <Card>
          <CardHeader title="Solar PV System" icon={<Sun size={15} className="text-amber-400" />} />
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-amber-400">{currentSolar.toFixed(2)}</span>
              <span className="text-sm text-slate-400">MW</span>
              <Badge variant="warning" size="sm">Current</Badge>
            </div>
            <ProgressBar value={(currentSolar / 1.0) * 100} color="amber" showValue label="% of rated capacity (1.0 MW)" />
            <div className="space-y-0 mt-2">
              <DataRow label="Daily energy" value="2.8 MWh" />
              <DataRow label="Weekly energy" value="18.6 MWh" />
              <DataRow label="Solar irradiance" value={`${weather?.solarIrradianceWm2 ?? 185} W/m²`} />
              <DataRow label="Cloud cover impact" value={`${weather?.energyImpact.solarGenerationImpactPct ?? -18}%`} />
              <DataRow label="Panel temperature" value="-15.2°C" />
              <DataRow label="System efficiency" value="18.4%" />
              <DataRow label="Panel health" value="Healthy (86/100)" mono={false} />
            </div>
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-400">
              ⚠ Solar generation will drop 80–95% during forecast blizzard (Sept 18). Pre-charge battery recommended.
            </div>
          </div>
        </Card>

        {/* Wind */}
        <Card>
          <CardHeader title="Wind Turbine System" icon={<Wind size={15} className="text-emerald-400" />} />
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400">{currentWind.toFixed(2)}</span>
              <span className="text-sm text-slate-400">MW</span>
              <Badge variant="success" size="sm">Current</Badge>
            </div>
            <ProgressBar value={(currentWind / 1.0) * 100} color="green" showValue label="% of rated capacity (1.0 MW)" />
            <div className="space-y-0 mt-2">
              <DataRow label="Wind speed" value={weather ? formatWindSpeed(weather.windSpeedMs) : '9.2 m/s'} />
              <DataRow label="Wind direction" value={weather ? `${windDirectionLabel(weather.windDirectionDeg)} (${weather.windDirectionDeg}°)` : 'WSW (247°)'} />
              <DataRow label="Wind gusts" value={weather ? formatWindSpeed(weather.windGustMs) : '14.5 m/s'} />
              <DataRow label="Daily energy" value="14.2 MWh" />
              <DataRow label="Turbines online" value="1 / 2" />
              <DataRow label="T1 health" value="Healthy (91/100)" mono={false} />
              <DataRow label="T2 health" value="⚠ Watch (72/100) — sensor offline" mono={false} />
            </div>
            <div className="bg-red-500/8 border border-red-500/20 rounded-lg p-2.5 text-xs text-red-400">
              🔴 Wind Turbine T2 telemetry sensor offline. Data from T2 is estimated. Technician dispatch recommended.
            </div>
          </div>
        </Card>
      </div>

      {/* Combined Forecast Chart */}
      <Card>
        <CardHeader
          title="24-Hour Renewable Forecast"
          subtitle="Combined Solar + Wind generation"
          icon={<BarChart2 size={15} />}
          actions={<Badge variant="warning" size="sm">FORECAST</Badge>}
        />
        <div className="mb-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/30 border border-amber-400/50 inline-block" aria-hidden="true" />
            <span className="text-slate-500">Solar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/30 border border-emerald-400/50 inline-block" aria-hidden="true" />
            <span className="text-slate-500">Wind</span>
          </div>
        </div>
        {renewForecast ? (
          /* @ts-ignore */
          <RenewableChart data={renewForecast} height={250} />
        ) : <Skeleton className="h-60" />}
      </Card>

      {/* Weather impact */}
      {weather && (
        <Card>
          <CardHeader title="Weather Impact on Renewable Generation" icon={<Wind size={15} />} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Solar impact', value: `${weather.energyImpact.solarGenerationImpactPct}%`, color: weather.energyImpact.solarGenerationImpactPct < 0 ? 'text-red-400' : 'text-emerald-400' },
              { label: 'Wind impact', value: `+${weather.energyImpact.windGenerationImpactPct}%`, color: 'text-emerald-400' },
              { label: 'Irradiance', value: `${weather.solarIrradianceWm2} W/m²`, color: 'text-amber-400' },
              { label: 'Cloud cover', value: `${weather.cloudCoverPercent}%`, color: 'text-slate-300' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-xl font-bold font-mono mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-slate-900/50 border border-slate-800/40 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
            {weather.energyImpact.description}
          </div>
        </Card>
      )}
    </div>
  );
}
