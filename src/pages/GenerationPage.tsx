import React from 'react';
import { Zap, BarChart2 } from 'lucide-react';
import { useEnergySnapshot, useEnergyHistory24h } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { EnergyHistoryChart, EnergyDonutChart } from '@/charts';
import { Skeleton } from '@/components/ui';
import { formatMW, renewableContribution, formatPct } from '@/utils/calculations';

export default function GenerationPage() {
  const { data: snap } = useEnergySnapshot();
  const { data: history } = useEnergyHistory24h();

  const mix = snap ? [
    { name: 'Solar', value: snap.solarGenerationMW, color: '#fbbf24' },
    { name: 'Wind', value: snap.windGenerationMW, color: '#34d399' },
    { name: 'Generator', value: snap.generatorOutputMW, color: '#fb923c' },
    { name: 'Battery', value: Math.max(0, -snap.batteryOutputMW), color: '#818cf8' },
  ].filter((d) => d.value > 0) : [];

  const renewPct = snap ? renewableContribution(snap.renewableGenerationMW, snap.totalLoadMW) : 0;

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Energy Generation</h1>
        <p className="text-xs text-slate-500 mt-0.5">Real-time generation from all sources</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Total Generation" value={snap ? snap.totalGenerationMW.toFixed(2) : '—'} unit="MW" icon={<Zap size={16} />} />
        <KPICard title="Solar PV" value={snap ? snap.solarGenerationMW.toFixed(2) : '—'} unit="MW" />
        <KPICard title="Wind Turbine" value={snap ? snap.windGenerationMW.toFixed(2) : '—'} unit="MW" />
        <KPICard title="Generator" value={snap ? snap.generatorOutputMW.toFixed(2) : '—'} unit="MW" />
        <KPICard title="Battery Discharge" value={snap ? Math.max(0, -snap.batteryOutputMW).toFixed(2) : '—'} unit="MW" />
        <KPICard title="Renewable Share" value={renewPct.toFixed(1)} unit="%" subtitle="% of total load" />
        <KPICard title="Total Load" value={snap ? snap.totalLoadMW.toFixed(2) : '—'} unit="MW" />
        <KPICard title="Power Balance" value={snap ? snap.powerBalance.toFixed(2) : '—'} unit="MW" status={snap && snap.powerBalance < -0.1 ? 'WARNING' : 'NORMAL'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Generation Mix" icon={<BarChart2 size={15} />} />
          <EnergyDonutChart data={mix} size={160} />
          <div className="mt-3 space-y-1.5">
            {mix.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
                  <span className="text-slate-400">{s.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-slate-200">{formatMW(s.value)}</span>
                  <span className="text-slate-600">{snap ? formatPct((s.value / snap.totalGenerationMW) * 100) : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader title="Generation History (24h)" icon={<Zap size={15} />} />
          {history ? (
            <EnergyHistoryChart data={history} unit="MW" height={230} color="#06b6d4" />
          ) : <Skeleton className="h-56" />}
        </Card>
      </div>
    </div>
  );
}
