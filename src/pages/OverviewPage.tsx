import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Battery, Fuel, Wind, Sun, Gauge, AlertTriangle,
  ArrowRight, Brain, TrendingUp, BarChart2, Shield
} from 'lucide-react';
import {
  useEnergySnapshot, useFuelData, useBatteryData, useLoadGroups,
  useWeatherData, useRenewableForecast
} from '@/hooks';
import { useAIStore } from '@/stores/aiStore';
import { useAlertStore } from '@/stores/alertStore';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { ProgressBar, Skeleton, KPISkeleton, DataRow } from '@/components/ui';
import { EnergyFlowDiagram } from '@/components/common/EnergyFlowDiagram';
import { RenewableChart, EnergyDonutChart, LoadDistributionChart } from '@/charts';
import {
  formatMW, formatFuelRuntime, formatPct, fuelRuntime,
  renewableContribution, energySecurityScore, riskLevel
} from '@/utils/calculations';

function RiskCard({ title, risk, description }: { title: string; risk: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL'; description: string }) {
  const colors: Record<string, string> = {
    NORMAL: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8',
    WATCH: 'text-blue-400 border-blue-500/25 bg-blue-500/8',
    WARNING: 'text-amber-400 border-amber-500/25 bg-amber-500/10',
    CRITICAL: 'text-red-400 border-red-500/30 bg-red-500/12',
  };
  return (
    <div className={`border rounded-xl p-3 flex flex-col gap-1.5 ${colors[risk]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200">{title}</span>
        <StatusBadge status={risk} />
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { data: energy, loading: eLoading } = useEnergySnapshot();
  const { data: fuel, loading: fLoading } = useFuelData();
  const { data: battery, loading: bLoading } = useBatteryData();
  const { data: loads } = useLoadGroups();
  const { data: weather } = useWeatherData();
  const { data: renewForecast } = useRenewableForecast();
  const recommendations = useAIStore((s) => s.recommendations);
  const pendingRecs = useMemo(() => recommendations.filter((r) => r.status === 'PENDING'), [recommendations]);
  const activeAlerts = useAlertStore((s) => s.getActiveCount());
  const criticalAlerts = useAlertStore((s) => s.getCriticalCount());
  const alerts = useAlertStore((s) => s.alerts);
  const recentAlerts = useMemo(() => alerts.filter((a) => a.status === 'ACTIVE').slice(0, 3), [alerts]);

  const fuelRuntimeHours = useMemo(
    () => fuel ? fuelRuntime(fuel.currentLevelLiters, fuel.consumptionRateLph) : 0,
    [fuel],
  );

  const renewPct = useMemo(
    () => energy ? renewableContribution(energy.renewableGenerationMW, energy.totalLoadMW) : 0,
    [energy],
  );

  const securityScore = useMemo(() => {
    if (!fuel || !battery) return 0;
    return energySecurityScore({
      fuelPct: fuel.levelPercent,
      socPct: battery.socPercent,
      sohPct: battery.sohPercent,
      generatorHealth: 88,
      renewableContributionPct: renewPct,
      shortageProbability: 8,
    });
  }, [fuel, battery, renewPct]);

  const batteryStatus = useMemo(() => {
    if (!battery) return 'NORMAL';
    return riskLevel(battery.socPercent, 40, 25, 15, true);
  }, [battery]);

  const fuelStatus = useMemo(() => {
    if (!fuel) return 'NORMAL';
    return riskLevel(fuel.levelPercent, 40, 25, 10, true);
  }, [fuel]);

  const loadData = useMemo(() => {
    if (!loads) return [];
    return loads.map((g) => ({
      name: g.name,
      value: g.currentMW,
      color: g.priority === 'CRITICAL' ? '#ef4444' : g.priority === 'ESSENTIAL' ? '#f59e0b' : '#64748b',
    }));
  }, [loads]);

  const generationMix = useMemo(() => {
    if (!energy) return [];
    return [
      { name: 'Solar', value: energy.solarGenerationMW, color: '#fbbf24' },
      { name: 'Wind', value: energy.windGenerationMW, color: '#34d399' },
      { name: 'Generator', value: energy.generatorOutputMW, color: '#fb923c' },
      { name: 'Battery', value: Math.max(0, -energy.batteryOutputMW), color: '#818cf8' },
    ].filter((d) => d.value > 0);
  }, [energy]);

  return (
    <div className="p-5 space-y-5 max-w-[1600px]">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Polar Research Station Alpha — Operational Overview</p>
        </div>
        <div className="flex items-center gap-2">
          {criticalAlerts > 0 && (
            <Link to="/alerts">
              <Button variant="danger" size="sm" icon={<AlertTriangle size={13} />}>
                {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''}
              </Button>
            </Link>
          )}
          <Link to="/ai">
            <Button variant="outline" size="sm" icon={<Brain size={13} />}>
              {pendingRecs.length} AI Recommendation{pendingRecs.length !== 1 ? 's' : ''}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {eLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
        ) : energy ? (
          <>
            <KPICard
              title="Current Load"
              value={energy.totalLoadMW.toFixed(2)}
              unit="MW"
              subtitle={`${formatPct(renewPct)} renewable`}
              trend={7.2}
              trendLabel="vs prev hour"
              icon={<Zap size={16} />}
            />
            <KPICard
              title="Generation"
              value={energy.totalGenerationMW.toFixed(2)}
              unit="MW"
              subtitle={`Balance: ${energy.powerBalance > 0 ? '+' : ''}${energy.powerBalance.toFixed(2)} MW`}
              icon={<Gauge size={16} />}
              status={energy.powerBalance < -0.1 ? 'WARNING' : 'NORMAL'}
            />
            <KPICard
              title="Renewable"
              value={energy.renewableGenerationMW.toFixed(2)}
              unit="MW"
              subtitle={`${formatPct(renewPct)} of load`}
              icon={<Wind size={16} />}
            />
            <KPICard
              title="Battery SOC"
              value={battery ? battery.socPercent.toFixed(1) : '—'}
              unit="%"
              subtitle={battery ? `≈ ${battery.availableEnergyMWh.toFixed(1)} MWh available` : ''}
              status={batteryStatus}
              statusLabel={battery?.mode}
              icon={<Battery size={16} />}
            />
            <KPICard
              title="Fuel Reserve"
              value={fuel ? fuel.levelPercent.toFixed(1) : '—'}
              unit="%"
              subtitle={fuel ? `Runtime: ${formatFuelRuntime(fuelRuntimeHours)}` : ''}
              status={fuelStatus}
              icon={<Fuel size={16} />}
            />
            <KPICard
              title="Security Score"
              value={securityScore}
              unit="/100"
              subtitle="Energy security index"
              status={securityScore < 50 ? 'CRITICAL' : securityScore < 65 ? 'WARNING' : securityScore < 80 ? 'WATCH' : 'NORMAL'}
              icon={<Shield size={16} />}
            />
          </>
        ) : null}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Energy Flow */}
        <Card className="lg:col-span-1">
          <CardHeader title="Energy Flow" icon={<Zap size={15} />} />
          {energy ? (
            <EnergyFlowDiagram
              solar={energy.solarGenerationMW}
              wind={energy.windGenerationMW}
              battery={energy.batteryOutputMW}
              generator={energy.generatorOutputMW}
              load={energy.totalLoadMW}
              criticalLoad={loads?.[0]?.currentMW ?? 1.24}
              essentialLoad={loads?.[1]?.currentMW ?? 0.98}
              nonCriticalLoad={loads?.[2]?.currentMW ?? 0.62}
            />
          ) : <Skeleton className="h-64 rounded-xl" />}
        </Card>

        {/* Renewable Forecast */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Renewable Generation Forecast"
            subtitle="Solar + Wind — next 24 hours"
            icon={<Sun size={15} />}
            actions={
              <Link to="/renewables" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                Details <ArrowRight size={12} />
              </Link>
            }
          />
          {renewForecast ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block rounded" aria-hidden="true" />
                  <span className="text-slate-500">Solar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block rounded" aria-hidden="true" />
                  <span className="text-slate-500">Wind</span>
                </div>
                <Badge variant="warning" size="sm">Forecast</Badge>
              </div>
              {/* @ts-ignore */}
              <RenewableChart data={renewForecast} height={200} />
            </div>
          ) : <Skeleton className="h-52 rounded-xl" />}
        </Card>
      </div>

      {/* Risk + AI + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Energy Risks */}
        <Card>
          <CardHeader title="Energy Risks" icon={<AlertTriangle size={15} />} />
          <div className="space-y-2">
            <RiskCard title="Fuel Supply" risk={fuelStatus} description={fuel ? `${formatPct(fuel.levelPercent)} remaining, ${formatFuelRuntime(fuelRuntimeHours)} runtime` : 'Loading...'} />
            <RiskCard title="Battery Reserve" risk={batteryStatus} description={battery ? `SOC: ${battery.socPercent.toFixed(1)}%, SOH: ${battery.sohPercent.toFixed(1)}%` : 'Loading...'} />
            <RiskCard title="Weather" risk={weather?.energyImpact.overallRiskLevel ?? 'NORMAL'} description={weather ? weather.energyImpact.description.slice(0, 80) + '...' : 'Loading...'} />
            <RiskCard title="Generator" risk="WATCH" description="G-03 maintenance overdue. G-01 and G-02 nominal." />
          </div>
        </Card>

        {/* Generation Mix */}
        <Card>
          <CardHeader title="Generation Mix" icon={<BarChart2 size={15} />} />
          <div className="flex items-center gap-4">
            <EnergyDonutChart data={generationMix} size={140} />
            <div className="flex flex-col gap-2 text-xs flex-1">
              {generationMix.map((g) => (
                <div key={g.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} aria-hidden="true" />
                    <span className="text-slate-400">{g.name}</span>
                  </div>
                  <span className="font-mono text-slate-200">{formatMW(g.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader
            title="AI Recommendations"
            icon={<Brain size={15} />}
            actions={
              <Link to="/ai" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                All <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="space-y-2">
            {pendingRecs.slice(0, 3).map((rec) => (
              <div key={rec.id} className="border border-slate-800/50 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant={rec.priority === 'HIGH' ? 'danger' : rec.priority === 'MEDIUM' ? 'warning' : 'info'} size="sm">
                    {rec.priority}
                  </Badge>
                  <span className="text-[10px] text-slate-600">{rec.confidence}% conf.</span>
                </div>
                <p className="text-xs text-slate-300 leading-tight truncate-lines-2">{rec.title}</p>
                <Link to="/ai">
                  <button className="text-[10px] text-cyan-500 hover:text-cyan-400">Review →</button>
                </Link>
              </div>
            ))}
            {pendingRecs.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">No pending recommendations</p>
            )}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader
            title="Active Alerts"
            icon={<AlertTriangle size={15} />}
            actions={
              <Link to="/alerts" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                All ({activeAlerts}) <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="border border-slate-800/50 rounded-lg p-2.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-[10px] text-slate-600 shrink-0">{alert.category}</span>
                </div>
                <p className="text-xs text-slate-300 leading-tight truncate-lines-2">{alert.title}</p>
              </div>
            ))}
            {recentAlerts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </Card>
      </div>

      {/* Load Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Load Distribution" subtitle="Current consumption by group" icon={<BarChart2 size={15} />} />
          {loadData.length > 0 ? (
            <div className="space-y-3">
              <LoadDistributionChart data={loadData} height={140} />
              <div className="space-y-1">
                {loads?.map((g) => (
                  <div key={g.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.priority === 'CRITICAL' ? '#ef4444' : g.priority === 'ESSENTIAL' ? '#f59e0b' : '#64748b' }} aria-hidden="true" />
                    <span className="text-xs text-slate-400 flex-1">{g.name}</span>
                    <span className="text-xs font-mono text-slate-200">{formatMW(g.currentMW)}</span>
                    <span className="text-xs text-slate-600">({formatPct(g.percentOfTotal)})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Skeleton className="h-40 rounded-xl" />}
        </Card>

        {/* Weather Impact */}
        <Card>
          <CardHeader title="Weather Impact" subtitle="Current environmental conditions" icon={<Wind size={15} />} actions={
            <Link to="/weather" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
              Details <ArrowRight size={12} />
            </Link>
          } />
          {weather ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Temperature</p>
                  <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{weather.temperatureCelsius.toFixed(1)}°C</p>
                  <p className="text-[11px] text-slate-600">Feels {weather.feelsLikeCelsius.toFixed(1)}°C</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Wind</p>
                  <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{weather.windSpeedMs.toFixed(1)} m/s</p>
                  <p className="text-[11px] text-slate-600">Gusts {weather.windGustMs.toFixed(1)} m/s</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <DataRow label="Solar irradiance" value={weather.solarIrradianceWm2} unit="W/m²" />
                <DataRow label="Cloud cover" value={`${weather.cloudCoverPercent}%`} unit="" />
                <DataRow label="Solar impact" value={`${weather.energyImpact.solarGenerationImpactPct > 0 ? '+' : ''}${weather.energyImpact.solarGenerationImpactPct}%`} unit="" />
                <DataRow label="Wind gen. impact" value={`+${weather.energyImpact.windGenerationImpactPct}%`} unit="" />
              </div>
              <div className={`rounded-lg px-3 py-2 text-xs ${weather.energyImpact.overallRiskLevel === 'NORMAL' ? 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'}`}>
                {weather.energyImpact.description.slice(0, 120)}...
              </div>
            </div>
          ) : <Skeleton className="h-48 rounded-xl" />}
        </Card>
      </div>
    </div>
  );
}
