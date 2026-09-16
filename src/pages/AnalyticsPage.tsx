import React, { useState } from 'react';
import { BarChart3, Calendar, Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, Badge, Select } from '@/components/ui';
import { EnergyHistoryChart } from '@/charts';
import { energyHistory24h, energyHistory7d } from '@/mock/energyData';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');

  const tabs = [
    { id: '24h', label: 'Today (24h)' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
  ];

  const data = period === '24h' ? energyHistory24h : energyHistory7d;

  const stats = [
    { label: 'Avg Load', value: '2.83 MW', change: '+2.1%' },
    { label: 'Peak Load', value: '3.42 MW', change: '+0.8%' },
    { label: 'Total Generation', value: '478 MWh', change: '-1.2%' },
    { label: 'Renewable %', value: '39.2%', change: '+3.4%' },
    { label: 'Fuel Consumed', value: '14,685 L', change: '+4.1%' },
    { label: 'Generator Runtime', value: '168h', change: '—' },
    { label: 'Battery Efficiency', value: '94.2%', change: '-0.3%' },
    { label: 'Peak Demand Day', value: 'Sep 16', change: '' },
  ];

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Historical Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Energy performance trends and historical analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs tabs={tabs} active={period} onChange={setPeriod} />
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>Export</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-xl font-bold font-mono text-slate-100 mt-1">{s.value}</p>
            {s.change && (
              <p className={`text-xs mt-0.5 ${s.change.startsWith('+') ? 'text-amber-400' : s.change.startsWith('-') ? 'text-emerald-400' : 'text-slate-600'}`}>
                {s.change} vs prev period
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Energy Load History" icon={<BarChart3 size={15} />} actions={<Badge variant="warning">DEMO</Badge>} />
          <EnergyHistoryChart data={data} unit="MW" height={200} color="#06b6d4" />
        </Card>
        <Card>
          <CardHeader title="Generation History" icon={<BarChart3 size={15} />} />
          <EnergyHistoryChart data={data.map((d) => ({ ...d, actual: d.actual * 1.02 }))} unit="MW" height={200} color="#34d399" />
        </Card>
        <Card>
          <CardHeader title="Renewable Contribution" icon={<BarChart3 size={15} />} />
          <EnergyHistoryChart data={data.map((d) => ({ ...d, actual: d.actual * 0.39 }))} unit="MW" height={200} color="#fbbf24" />
        </Card>
        <Card>
          <CardHeader title="Fuel Consumption" icon={<BarChart3 size={15} />} />
          <EnergyHistoryChart data={data.map((d) => ({ ...d, actual: d.actual * 87.4 }))} unit="L/h" height={200} color="#fb923c" />
        </Card>
      </div>

      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-400">
        <strong className="text-blue-400">Note:</strong> All analytics data is simulated for demonstration purposes. 30d and 90d ranges will be available with backend integration.
      </div>
    </div>
  );
}
