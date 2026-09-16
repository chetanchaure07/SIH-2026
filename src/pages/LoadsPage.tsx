import React, { useState } from 'react';
import { Layers, Heart, Radio, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoadGroups } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, ProgressBar, DataRow, Skeleton } from '@/components/ui';
import { LoadDistributionChart, EnergyDonutChart } from '@/charts';
import { formatMW, formatPct } from '@/utils/calculations';
import type { LoadGroup, IndividualLoad, LoadPriority } from '@/types';

const priorityColors: Record<LoadPriority, string> = {
  CRITICAL: '#ef4444',
  ESSENTIAL: '#f59e0b',
  NON_CRITICAL: '#64748b',
};

const priorityIcons: Record<LoadPriority, React.ReactNode> = {
  CRITICAL: <Heart size={14} className="text-red-400" />,
  ESSENTIAL: <Radio size={14} className="text-amber-400" />,
  NON_CRITICAL: <Monitor size={14} className="text-slate-400" />,
};

const priorityBadgeVariant: Record<LoadPriority, 'danger' | 'warning' | 'muted'> = {
  CRITICAL: 'danger',
  ESSENTIAL: 'warning',
  NON_CRITICAL: 'muted',
};

function LoadGroupCard({ group }: { group: LoadGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        aria-expanded={expanded}
        aria-controls={`loads-${group.id}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">{priorityIcons[group.priority]}</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{group.name}</h3>
              <p className="text-xs text-slate-500">{group.loads.length} subsystems</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={priorityBadgeVariant[group.priority]}>{group.priority.replace('_', ' ')}</Badge>
            {expanded ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-2xl font-bold font-mono text-slate-100">{group.currentMW.toFixed(2)}</span>
          <span className="text-sm text-slate-400">MW</span>
          <span className="text-xs text-slate-600 ml-2">{formatPct(group.percentOfTotal)} of total</span>
        </div>

        <ProgressBar
          value={group.currentMW}
          max={group.peakMW}
          showValue={false}
          color={group.priority === 'CRITICAL' ? 'red' : group.priority === 'ESSENTIAL' ? 'amber' : 'cyan'}
        />
      </button>

      {/* Individual loads */}
      {expanded && (
        <div id={`loads-${group.id}`} className="mt-4 space-y-2 border-t border-slate-800/50 pt-3">
          {group.loads.map((load) => (
            <LoadRow key={load.id} load={load} />
          ))}
        </div>
      )}
    </Card>
  );
}

function LoadRow({ load }: { load: IndividualLoad }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-slate-800/30 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate">{load.name}</p>
        <p className="text-[10px] text-slate-600">{load.category}</p>
      </div>
      <div className="w-20">
        <ProgressBar value={load.percentOfRated} size="xs" color={load.priority === 'CRITICAL' ? 'red' : 'amber'} />
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-mono text-slate-200">{load.currentMW.toFixed(2)} MW</p>
        <p className="text-[10px] text-slate-600">{load.percentOfRated.toFixed(0)}% rated</p>
      </div>
      <Badge variant={load.status === 'ACTIVE' ? 'success' : load.status === 'STANDBY' ? 'info' : 'muted'} size="sm">
        {load.status}
      </Badge>
    </div>
  );
}

export default function LoadsPage() {
  const { data: loads, loading } = useLoadGroups();

  const totalLoad = loads?.reduce((s, g) => s + g.currentMW, 0) ?? 0;

  const donutData = loads?.map((g) => ({
    name: g.name,
    value: g.currentMW,
    color: priorityColors[g.priority],
  })) ?? [];

  const barData = loads?.flatMap((g) =>
    g.loads.map((l) => ({ name: l.name, value: l.currentMW, color: priorityColors[g.priority] }))
  ) ?? [];

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Load Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">Station power consumption by priority category</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
          <p className="text-xs text-slate-500">Total Load</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalLoad.toFixed(2)} MW</p>
        </div>
        {loads?.map((g) => (
          <div key={g.id} className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
            <p className="text-xs text-slate-500">{g.name}</p>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{formatMW(g.currentMW)}</p>
            <p className="text-xs text-slate-600">{formatPct(g.percentOfTotal)}</p>
          </div>
        ))}
      </div>

      {/* Charts + Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Donut + Bar */}
        <Card>
          <CardHeader title="Load Mix" icon={<Layers size={15} />} />
          <EnergyDonutChart data={donutData} size={160} />
          <div className="mt-3 space-y-1">
            {loads?.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors[g.priority] }} aria-hidden="true" />
                  <span className="text-slate-400">{g.name.split(' ')[0]}</span>
                </div>
                <span className="font-mono text-slate-200">{formatPct(g.percentOfTotal)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Load groups */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
          ) : (
            loads?.map((group) => <LoadGroupCard key={group.id} group={group} />)
          )}
        </div>
      </div>

      {/* All loads bar chart */}
      <Card>
        <CardHeader title="Individual Load Breakdown" subtitle="Consumption by subsystem" icon={<Layers size={15} />} />
        <LoadDistributionChart data={barData.slice(0, 10)} height={220} />
      </Card>
    </div>
  );
}
