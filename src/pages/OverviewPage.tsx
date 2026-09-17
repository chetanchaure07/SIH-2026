import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Battery, Fuel, Wind, Sun, AlertTriangle,
  ArrowRight, Brain, BarChart2, CheckCircle2,
  Thermometer, ChevronDown, ChevronUp, Heart, Radio, Monitor
} from 'lucide-react';
import {
  useEnergySnapshot, useFuelData, useBatteryData, useLoadGroups,
  useWeatherData, useRenewableForecast
} from '@/hooks';
import { useAIStore } from '@/stores/aiStore';
import { useAlertStore } from '@/stores/alertStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { ProgressBar, Skeleton, KPISkeleton } from '@/components/ui';
import { EnergyFlowDiagram } from '@/components/common/EnergyFlowDiagram';
import { RenewableChart, EnergyDonutChart } from '@/charts';
import {
  formatMW, formatFuelRuntime, formatPct, fuelRuntime,
  renewableContribution, energySecurityScore, riskLevel
} from '@/utils/calculations';

// Simple hero stat card
function HeroCard({
  label,
  value,
  unit,
  sub,
  status,
  icon,
  to,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: string;
  status?: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  icon: React.ReactNode;
  to?: string;
}) {
  const statusColor: Record<string, string> = {
    NORMAL: 'text-emerald-400',
    WATCH: 'text-blue-400',
    WARNING: 'text-amber-400',
    CRITICAL: 'text-red-400',
  };
  const borderColor: Record<string, string> = {
    NORMAL: 'border-emerald-500/20',
    WATCH: 'border-blue-500/20',
    WARNING: 'border-amber-500/25',
    CRITICAL: 'border-red-500/30',
  };

  const inner = (
    <div
      className={`bg-[#041219] border rounded-xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.01] hover:shadow-lg ${
        status ? borderColor[status] : 'border-slate-800/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <span className={status ? statusColor[status] : 'text-cyan-400'}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold font-mono ${status ? statusColor[status] : 'text-slate-100'}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-slate-500 leading-tight">{sub}</p>}
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

// Plain-English weather insight row
function WeatherInsight({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 ${color}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  );
}

// Simplified load priority card
function LoadPriorityCard({
  label,
  mw,
  pct,
  color,
  icon,
  badgeVariant,
}: {
  label: string;
  mw: number;
  pct: number;
  color: 'red' | 'amber' | 'cyan';
  icon: React.ReactNode;
  badgeVariant: 'danger' | 'warning' | 'muted';
}) {
  return (
    <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-slate-200">{label}</span>
        </div>
        <Badge variant={badgeVariant} size="sm">{formatPct(pct)}</Badge>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold font-mono text-slate-100">{mw.toFixed(2)}</span>
        <span className="text-xs text-slate-500">MW</span>
      </div>
      <ProgressBar value={pct} color={color} size="xs" showValue={false} />
    </div>
  );
}

export default function OverviewPage() {
  const { data: energy, loading: eLoading } = useEnergySnapshot();
  const { data: fuel } = useFuelData();
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
    if (!battery) return 'NORMAL' as const;
    return riskLevel(battery.socPercent, 40, 25, 15, true);
  }, [battery]);

  const fuelStatus = useMemo(() => {
    if (!fuel) return 'NORMAL' as const;
    return riskLevel(fuel.levelPercent, 40, 25, 10, true);
  }, [fuel]);

  const overallStatus = useMemo((): 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL' => {
    if (securityScore < 50) return 'CRITICAL';
    if (securityScore < 65) return 'WARNING';
    if (securityScore < 80) return 'WATCH';
    return 'NORMAL';
  }, [securityScore]);

  const overallStatusLabel: Record<string, string> = {
    NORMAL: 'All Systems Normal',
    WATCH: 'Monitor Closely',
    WARNING: 'Attention Required',
    CRITICAL: 'Action Required',
  };

  const generationMix = useMemo(() => {
    if (!energy) return [];
    return [
      { name: 'Solar', value: energy.solarGenerationMW, color: '#fbbf24' },
      { name: 'Wind', value: energy.windGenerationMW, color: '#34d399' },
      { name: 'Generator', value: energy.generatorOutputMW, color: '#fb923c' },
      { name: 'Battery', value: Math.max(0, -energy.batteryOutputMW), color: '#818cf8' },
    ].filter((d) => d.value > 0);
  }, [energy]);

  // Weather plain-English insights
  const weatherInsights = useMemo(() => {
    if (!weather) return [];
    const insights: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (weather.temperatureCelsius < -15) {
      insights.push({
        icon: <Thermometer size={14} className="text-blue-300" />,
        text: `Very cold (${weather.temperatureCelsius.toFixed(1)}°C) — heating demand is significantly elevated`,
        color: 'bg-blue-500/8 border border-blue-500/20 text-blue-300',
      });
    } else if (weather.temperatureCelsius < -5) {
      insights.push({
        icon: <Thermometer size={14} className="text-blue-300" />,
        text: `Cold conditions (${weather.temperatureCelsius.toFixed(1)}°C) — expect increased heating load`,
        color: 'bg-blue-500/8 border border-blue-500/20 text-blue-300',
      });
    } else {
      insights.push({
        icon: <Thermometer size={14} className="text-emerald-400" />,
        text: `Temperature is ${weather.temperatureCelsius.toFixed(1)}°C — heating demand is normal`,
        color: 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400',
      });
    }

    if (weather.windSpeedMs > 10) {
      insights.push({
        icon: <Wind size={14} className="text-emerald-400" />,
        text: `Strong wind (${weather.windSpeedMs.toFixed(1)} m/s) — wind generation is favorable`,
        color: 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400',
      });
    } else if (weather.windSpeedMs > 5) {
      insights.push({
        icon: <Wind size={14} className="text-slate-400" />,
        text: `Moderate wind (${weather.windSpeedMs.toFixed(1)} m/s) — wind generation is adequate`,
        color: 'bg-slate-800/50 border border-slate-700/40 text-slate-400',
      });
    } else {
      insights.push({
        icon: <Wind size={14} className="text-amber-400" />,
        text: `Low wind (${weather.windSpeedMs.toFixed(1)} m/s) — wind generation may be limited`,
        color: 'bg-amber-500/8 border border-amber-500/20 text-amber-400',
      });
    }

    if (weather.cloudCoverPercent > 70) {
      insights.push({
        icon: <Sun size={14} className="text-amber-400" />,
        text: `High cloud cover (${weather.cloudCoverPercent}%) — solar generation is reduced`,
        color: 'bg-amber-500/8 border border-amber-500/20 text-amber-400',
      });
    } else if (weather.cloudCoverPercent > 30) {
      insights.push({
        icon: <Sun size={14} className="text-amber-300" />,
        text: `Partial cloud cover (${weather.cloudCoverPercent}%) — solar generation is moderate`,
        color: 'bg-slate-800/50 border border-slate-700/40 text-slate-300',
      });
    } else {
      insights.push({
        icon: <Sun size={14} className="text-amber-400" />,
        text: `Clear conditions (${weather.cloudCoverPercent}% cloud cover) — good solar potential`,
        color: 'bg-amber-500/8 border border-amber-500/20 text-amber-400',
      });
    }

    return insights;
  }, [weather]);

  return (
    <div className="p-5 space-y-6 max-w-[1600px]">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Energy Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Polar Research Station Alpha — System Overview</p>
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
              {pendingRecs.length} AI Suggestion{pendingRecs.length !== 1 ? 's' : ''}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Row 1: Hero Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {eLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          <>
            <HeroCard
              label="Energy Produced"
              value={energy ? energy.totalGenerationMW.toFixed(2) : '—'}
              unit="MW"
              sub={`${formatPct(renewPct)} from renewables`}
              icon={<Zap size={16} />}
              to="/generation"
            />
            <HeroCard
              label="Energy Used"
              value={energy ? energy.totalLoadMW.toFixed(2) : '—'}
              unit="MW"
              sub="Station total consumption"
              icon={<BarChart2 size={16} />}
              to="/loads"
            />
            <HeroCard
              label="Battery Level"
              value={battery ? battery.socPercent.toFixed(0) : '—'}
              unit="%"
              sub={battery ? `${battery.availableEnergyMWh.toFixed(1)} MWh stored · ${battery.mode}` : ''}
              status={batteryStatus}
              icon={<Battery size={16} />}
              to="/battery"
            />
            <HeroCard
              label="System Status"
              value={overallStatusLabel[overallStatus]}
              status={overallStatus}
              sub={`Security score: ${securityScore}/100`}
              icon={<CheckCircle2 size={16} />}
            />
            <HeroCard
              label="AI Suggestions"
              value={pendingRecs.length}
              sub={pendingRecs.length > 0 ? pendingRecs[0].title.slice(0, 40) + '…' : 'No pending actions'}
              icon={<Brain size={16} />}
              to="/ai"
            />
            <HeroCard
              label="Backup Fuel"
              value={fuel ? fuel.levelPercent.toFixed(0) : '—'}
              unit="%"
              sub={fuel ? `~${formatFuelRuntime(fuelRuntimeHours)} remaining` : ''}
              status={fuelStatus}
              icon={<Fuel size={16} />}
              to="/fuel"
            />
          </>
        )}
      </div>

      {/* ── Row 2: Energy Flow + Renewable Forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Energy Flow */}
        <Card className="lg:col-span-1">
          <CardHeader title="Energy Flow" subtitle="Where power is coming from and going to" icon={<Zap size={15} />} />
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
            title="Renewable Generation — Next 24 Hours"
            subtitle="Forecast solar and wind output"
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

      {/* ── Row 3: Generation Mix + AI Recommendations + Alerts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Generation Mix */}
        <Card>
          <CardHeader
            title="Generation Mix"
            subtitle="Current output by source"
            icon={<BarChart2 size={15} />}
            actions={
              <Link to="/generation" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                Details <ArrowRight size={12} />
              </Link>
            }
          />
          {energy ? (
            <div className="flex items-center gap-4">
              <EnergyDonutChart data={generationMix} size={140} />
              <div className="flex flex-col gap-2.5 text-xs flex-1">
                {generationMix.map((g) => (
                  <div key={g.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} aria-hidden="true" />
                      <span className="text-slate-400">{g.name}</span>
                    </div>
                    <span className="font-mono text-slate-200">{formatMW(g.value)}</span>
                  </div>
                ))}
                <div className="mt-1 pt-2 border-t border-slate-800/50 flex justify-between text-slate-500">
                  <span>Renewables</span>
                  <span className="font-mono text-emerald-400">{formatPct(renewPct)}</span>
                </div>
              </div>
            </div>
          ) : <Skeleton className="h-40 rounded-xl" />}
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader
            title="AI Recommendations"
            subtitle="System suggestions requiring your review"
            icon={<Brain size={15} />}
            actions={
              <Link to="/ai" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                All <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="space-y-2">
            {pendingRecs.slice(0, 3).map((rec) => (
              <div key={rec.id} className="border border-slate-800/50 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant={rec.priority === 'HIGH' ? 'danger' : rec.priority === 'MEDIUM' ? 'warning' : 'info'} size="sm">
                    {rec.priority === 'HIGH' ? 'Urgent' : rec.priority === 'MEDIUM' ? 'Recommended' : 'Optional'}
                  </Badge>
                  <span className="text-[10px] text-slate-600">{rec.confidence}% confidence</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">{rec.title}</p>
                <Link to="/ai">
                  <button className="text-[10px] text-cyan-500 hover:text-cyan-400">Review →</button>
                </Link>
              </div>
            ))}
            {pendingRecs.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 size={28} className="text-emerald-500/40 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No pending recommendations</p>
              </div>
            )}
          </div>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader
            title="Active Alerts"
            subtitle="Issues that need attention"
            icon={<AlertTriangle size={15} />}
            actions={
              <Link to="/alerts" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                All ({activeAlerts}) <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="border border-slate-800/50 rounded-lg p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-[10px] text-slate-600 shrink-0 capitalize">{alert.category.toLowerCase()}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">{alert.title}</p>
              </div>
            ))}
            {recentAlerts.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 size={28} className="text-emerald-500/40 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No active alerts</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 4: Power Consumption + Weather ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Load Priority Cards */}
        <Card>
          <CardHeader
            title="Power Consumption by Priority"
            subtitle="Station loads grouped by importance"
            icon={<BarChart2 size={15} />}
            actions={
              <Link to="/loads" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                Details <ArrowRight size={12} />
              </Link>
            }
          />
          {loads && loads.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {loads.map((g) => {
                const colorMap: Record<string, 'red' | 'amber' | 'cyan'> = {
                  CRITICAL: 'red', ESSENTIAL: 'amber', NON_CRITICAL: 'cyan',
                };
                const badgeMap: Record<string, 'danger' | 'warning' | 'muted'> = {
                  CRITICAL: 'danger', ESSENTIAL: 'warning', NON_CRITICAL: 'muted',
                };
                const iconMap: Record<string, React.ReactNode> = {
                  CRITICAL: <Heart size={13} className="text-red-400" />,
                  ESSENTIAL: <Radio size={13} className="text-amber-400" />,
                  NON_CRITICAL: <Monitor size={13} className="text-slate-400" />,
                };
                const displayLabel: Record<string, string> = {
                  CRITICAL: 'Critical Loads',
                  ESSENTIAL: 'Essential Loads',
                  NON_CRITICAL: 'Non-Essential Loads',
                };
                return (
                  <LoadPriorityCard
                    key={g.id}
                    label={displayLabel[g.priority] ?? g.name}
                    mw={g.currentMW}
                    pct={g.percentOfTotal}
                    color={colorMap[g.priority] ?? 'cyan'}
                    icon={iconMap[g.priority]}
                    badgeVariant={badgeMap[g.priority] ?? 'muted'}
                  />
                );
              })}
            </div>
          ) : <Skeleton className="h-40 rounded-xl" />}
        </Card>

        {/* Weather — Plain-English */}
        <Card>
          <CardHeader
            title="Weather Conditions"
            subtitle="How today's weather affects energy"
            icon={<Wind size={15} />}
            actions={
              <Link to="/weather" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                Details <ArrowRight size={12} />
              </Link>
            }
          />
          {weather ? (
            <div className="space-y-3">
              {/* Quick summary row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3">
                  <p className="text-[11px] text-slate-500 mb-1">Temperature</p>
                  <p className="text-xl font-bold font-mono text-slate-100">{weather.temperatureCelsius.toFixed(1)}°C</p>
                  <p className="text-[11px] text-slate-600">Feels {weather.feelsLikeCelsius.toFixed(1)}°C</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3">
                  <p className="text-[11px] text-slate-500 mb-1">Wind Speed</p>
                  <p className="text-xl font-bold font-mono text-slate-100">{weather.windSpeedMs.toFixed(1)} m/s</p>
                  <p className="text-[11px] text-slate-600">Gusts {weather.windGustMs.toFixed(1)} m/s</p>
                </div>
              </div>

              {/* Plain-English insights */}
              <div className="space-y-2">
                {weatherInsights.map((insight, i) => (
                  <WeatherInsight key={i} {...insight} />
                ))}
              </div>

              {/* Overall risk */}
              <div className={`rounded-lg px-3 py-2 text-xs ${
                weather.energyImpact.overallRiskLevel === 'NORMAL'
                  ? 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400'
                  : weather.energyImpact.overallRiskLevel === 'WARNING'
                  ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                  : 'bg-blue-500/8 border border-blue-500/20 text-blue-400'
              }`}>
                <span className="font-semibold">Weather impact: {weather.energyImpact.overallRiskLevel}</span>
                <span className="text-slate-500 ml-2">— {weather.energyImpact.description.slice(0, 100)}</span>
              </div>
            </div>
          ) : <Skeleton className="h-48 rounded-xl" />}
        </Card>
      </div>
    </div>
  );
}
