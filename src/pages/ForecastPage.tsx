import React, { useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { useForecast, useRenewableForecast } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { Tabs, Select, Badge, Skeleton, DataRow } from '@/components/ui';
import { ForecastChart, RenewableChart } from '@/charts';
import { confidenceColor, formatMW, formatMWh, formatFuelRuntime } from '@/utils/calculations';
import { aiModelInfo } from '@/mock/aiData';
import { format } from 'date-fns';
import type { ForecastConfidence } from '@/types';

function ConfidencePill({ confidence }: { confidence: ForecastConfidence }) {
  const colorMap = { HIGH: 'success', MEDIUM: 'warning', LOW: 'danger' } as const;
  return <Badge variant={colorMap[confidence]} size="sm">{confidence} CONFIDENCE</Badge>;
}

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const { data: forecast, loading } = useForecast(horizon);
  const { data: renewForecast } = useRenewableForecast();

  const horizonTabs = [
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
  ];

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Energy Forecast</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-powered load and generation predictions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm">SIMULATED FORECAST</Badge>
          <Tabs
            tabs={horizonTabs}
            active={horizon}
            onChange={(id) => setHorizon(id as typeof horizon)}
          />
        </div>
      </div>

      {/* Model info banner */}
      <div className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
        <Info size={15} className="text-blue-400 shrink-0" aria-hidden="true" />
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="text-slate-400">Model: <span className="text-slate-200 font-medium">{aiModelInfo.name} v{aiModelInfo.version}</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Trained: <span className="text-slate-200 font-medium">{format(new Date(aiModelInfo.lastTrained), 'dd MMM yyyy')}</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Coverage: <span className="text-slate-200 font-medium">{aiModelInfo.dataCoveragedays} days</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">7-day accuracy: <span className="text-emerald-400 font-medium">{aiModelInfo.accuracy7d}%</span></span>
        </div>
      </div>

      {/* Summary KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : forecast ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Peak Load', value: formatMW(forecast.predictedPeakLoad), note: 'Maximum expected' },
            { label: 'Min Load', value: formatMW(forecast.predictedMinLoad), note: 'Minimum expected' },
            { label: 'Avg Load', value: formatMW(forecast.predictedAvgLoad), note: 'Average over period' },
            { label: 'Renewable Gen', value: formatMW(forecast.predictedRenewable), note: 'Average renewable' },
            { label: 'Fuel Consumption', value: `${forecast.predictedFuelConsumption.toFixed(0)} L`, note: 'Over period' },
            { label: 'End Battery SOC', value: `${forecast.predictedEndSOC.toFixed(1)}%`, note: 'Predicted end state' },
            { label: 'Shortage Risk', value: `${forecast.shortageProbability}%`, note: 'Probability of deficit' },
            { label: 'Generator Runtime', value: `${forecast.predictedGeneratorRuntime.toFixed(0)}h`, note: 'Expected run hours' },
          ].map((item, i) => (
            <div key={i} className="bg-[#041219] border border-slate-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-xl font-bold font-mono text-slate-100 mt-1">{item.value}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{item.note}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Main Forecast Chart */}
      <Card>
        <CardHeader
          title={`Load Forecast — Next ${horizon}`}
          subtitle="Actual vs Predicted with confidence intervals"
          icon={<TrendingUp size={15} />}
          actions={forecast && <ConfidencePill confidence={forecast.overallConfidence} />}
        />
        <div className="mb-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded" />
            <span className="text-slate-500">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 inline-block rounded border-dashed" style={{ borderTop: '1px dashed' }} />
            <span className="text-slate-500">Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-amber-400/10 inline-block rounded border border-amber-400/20" />
            <span className="text-slate-500">Confidence band</span>
          </div>
        </div>
        {loading ? <Skeleton className="h-72 rounded-xl" /> : forecast ? (
          <ForecastChart data={forecast.dataPoints} unit="MW" height={300} showConfidenceBands />
        ) : null}
      </Card>

      {/* Renewable Forecast */}
      {renewForecast && (
        <Card>
          <CardHeader
            title="Renewable Generation Forecast"
            subtitle="Solar + Wind contributions — next 24h"
            icon={<TrendingUp size={15} />}
          />
          {/* @ts-ignore */}
          <RenewableChart data={renewForecast} height={220} />
        </Card>
      )}

      {/* Forecast breakdown */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Load Forecast" />
            <div className="space-y-0">
              <DataRow label="Peak load" value={formatMW(forecast.predictedPeakLoad)} />
              <DataRow label="Min load" value={formatMW(forecast.predictedMinLoad)} />
              <DataRow label="Average load" value={formatMW(forecast.predictedAvgLoad)} />
              <DataRow label="Shortage probability" value={`${forecast.shortageProbability}%`} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Generation Forecast" />
            <div className="space-y-0">
              <DataRow label="Avg renewable" value={formatMW(forecast.predictedRenewable)} />
              <DataRow label="Generator runtime" value={`${forecast.predictedGeneratorRuntime}h`} />
              <DataRow label="Fuel consumption" value={`${forecast.predictedFuelConsumption.toFixed(0)} L`} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Storage Forecast" />
            <div className="space-y-0">
              <DataRow label="Predicted end SOC" value={`${forecast.predictedEndSOC.toFixed(1)}%`} />
              <DataRow label="Overall confidence" value={forecast.overallConfidence} mono={false} />
              <DataRow label="Model version" value={forecast.modelVersion} mono={false} />
              <DataRow label="Generated at" value={format(new Date(forecast.generatedAt), 'HH:mm dd/MM')} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
