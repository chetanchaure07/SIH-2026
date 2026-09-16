import React, { useState } from 'react';
import { Gauge, Play, StopCircle, AlertTriangle, Clock, Thermometer } from 'lucide-react';
import { useGenerators, useGeneratorSchedule } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, ProgressBar, DataRow, Skeleton, StatusBadge, Tabs } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import type { GeneratorUnit, GeneratorStatus } from '@/types';
import { format } from 'date-fns';

function StatusBadgeGen({ status }: { status: GeneratorStatus }) {
  const map: Record<GeneratorStatus, { label: string; variant: 'success' | 'info' | 'muted' | 'warning' | 'danger' }> = {
    RUNNING: { label: 'Running', variant: 'success' },
    STANDBY: { label: 'Standby', variant: 'info' },
    OFFLINE: { label: 'Offline', variant: 'muted' },
    MAINTENANCE: { label: 'Maintenance', variant: 'warning' },
    FAULT: { label: 'Fault', variant: 'danger' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

function GeneratorCard({ gen }: { gen: GeneratorUnit }) {
  const loadColor = gen.loadPercent > 90 ? 'red' : gen.loadPercent > 75 ? 'amber' : 'green';
  const isActive = gen.status === 'RUNNING';

  return (
    <Card className={`${gen.status === 'FAULT' ? 'border-red-500/30' : gen.status === 'STANDBY' && gen.healthScore < 80 ? 'border-amber-500/25' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100">{gen.name}</h3>
          <p className="text-xs text-slate-500">{gen.model}</p>
        </div>
        <StatusBadgeGen status={gen.status} />
      </div>

      {/* Power output */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-bold font-mono text-slate-100">
          {gen.outputMW.toFixed(2)}
        </span>
        <span className="text-sm text-slate-400">MW</span>
        <span className="text-xs text-slate-600 ml-2">of {gen.ratedCapacityMW.toFixed(1)} MW rated</span>
      </div>

      {/* Load bar */}
      <div className="mb-3">
        <ProgressBar value={gen.loadPercent} showValue label="Load" color={loadColor} />
      </div>

      {/* Details */}
      <div className="space-y-0">
        <DataRow label="Efficiency" value={`${gen.efficiencyPercent.toFixed(1)}%`} />
        <DataRow label="Fuel consumption" value={`${gen.fuelConsumptionLph.toFixed(1)} L/h`} />
        <DataRow label="Temperature" value={`${gen.temperatureCelsius.toFixed(1)}°C`} />
        {isActive && gen.startedAt && (
          <DataRow label="Running since" value={format(new Date(gen.startedAt), 'dd/MM HH:mm')} />
        )}
        <DataRow label="Runtime (session)" value={`${gen.runtimeHours}h`} />
        <DataRow label="Health score" value={`${gen.healthScore}/100`} />
        <DataRow label="Next maintenance" value={gen.nextMaintenanceDate} />
      </div>

      {/* Alerts */}
      {gen.alerts.length > 0 && (
        <div className="mt-3 space-y-1">
          {gen.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-md px-2 py-1.5">
              <AlertTriangle size={11} aria-hidden="true" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800/50">
        {isActive ? (
          <Button variant="danger" size="sm" icon={<StopCircle size={13} />} fullWidth>Stop Generator</Button>
        ) : (
          <Button variant="success" size="sm" icon={<Play size={13} />} fullWidth disabled={gen.status === 'MAINTENANCE' || gen.status === 'FAULT'}>
            Start Generator
          </Button>
        )}
        <Button variant="ghost" size="sm">Details</Button>
      </div>
    </Card>
  );
}

export default function GeneratorsPage() {
  const { data: generators, loading } = useGenerators();
  const { data: schedule } = useGeneratorSchedule();
  const [tab, setTab] = useState('status');

  const totalOutput = generators?.reduce((sum, g) => sum + g.outputMW, 0) ?? 0;
  const totalFuelConsumption = generators?.reduce((sum, g) => sum + g.fuelConsumptionLph, 0) ?? 0;

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Generator Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">3 generators — 5.0 MW total rated capacity</p>
        </div>
        <Tabs
          tabs={[{ id: 'status', label: 'Status' }, { id: 'schedule', label: 'Schedule' }]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
          <p className="text-xs text-slate-500">Total Output</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalOutput.toFixed(2)} MW</p>
        </div>
        <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
          <p className="text-xs text-slate-500">Units Running</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{generators?.filter((g) => g.status === 'RUNNING').length ?? 0} / {generators?.length ?? 0}</p>
        </div>
        <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
          <p className="text-xs text-slate-500">Combined Fuel Consumption</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalFuelConsumption.toFixed(1)} L/h</p>
        </div>
        <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
          <p className="text-xs text-slate-500">Available Reserve</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1">3.0 MW</p>
          <p className="text-xs text-slate-600">G-03 standby</p>
        </div>
      </div>

      {tab === 'status' ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {generators?.map((gen) => <GeneratorCard key={gen.id} gen={gen} />)}
          </div>
        )
      ) : (
        <Card>
          <CardHeader title="Generator Schedule" subtitle="Current and planned operations" icon={<Clock size={15} />} />
          {schedule ? (
            <div className="space-y-3">
              {schedule.map((entry) => (
                <div key={`${entry.generatorId}-${entry.startTime}`} className={`border rounded-xl p-3 ${entry.isAiRecommended ? 'border-cyan-500/25 bg-cyan-500/5' : 'border-slate-800/50'}`}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.status === 'ACTIVE' ? 'success' : entry.status === 'PLANNED' ? 'info' : 'muted'} dot>
                        {entry.status}
                      </Badge>
                      <span className="text-sm font-semibold text-slate-200">{entry.generatorId}</span>
                      {entry.isAiRecommended && <Badge variant="default" size="sm">AI Recommended</Badge>}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {format(new Date(entry.startTime), 'dd/MM HH:mm')} → {format(new Date(entry.endTime), 'dd/MM HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{entry.reason}</p>
                  {entry.isAiRecommended && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="success" size="xs">Accept</Button>
                      <Button variant="danger" size="xs">Reject</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <Skeleton className="h-48" />}
        </Card>
      )}
    </div>
  );
}
