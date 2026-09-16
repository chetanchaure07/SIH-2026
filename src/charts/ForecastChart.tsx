import React, { memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { format } from 'date-fns';
import type { ForecastDataPoint } from '@/types';

interface ForecastChartProps {
  data: ForecastDataPoint[];
  unit?: string;
  height?: number;
  showConfidenceBands?: boolean;
  label?: string;
}

const CustomTooltip = ({ active, payload, label: tooltipLabel, unit }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#041219] border border-slate-700/60 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{tooltipLabel}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
            <span className="text-slate-400 capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-semibold text-slate-200">
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ForecastChart = memo(function ForecastChart({
  data,
  unit = 'MW',
  height = 280,
  showConfidenceBands = true,
}: ForecastChartProps) {
  // Find where actual ends and forecast begins
  const lastActualIndex = data.reduce((acc, d, i) => (d.actual !== undefined ? i : acc), -1);

  const formatted = data.map((d, i) => ({
    time: format(new Date(d.timestamp), 'HH:mm'),
    actual: d.actual,
    predicted: d.predicted,
    lower: showConfidenceBands ? d.lowerBound : undefined,
    upper: showConfidenceBands ? d.upperBound : undefined,
    isFuture: d.isFuture,
    index: i,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.06} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0a2233" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#475569', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#0a2233' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}`}
          unit={unit}
          width={52}
        />
        <Tooltip
          content={<CustomTooltip unit={unit} />}
          cursor={{ stroke: '#1c618f', strokeDasharray: '4 4', strokeWidth: 1 }}
        />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-slate-400 capitalize">{value}</span>
          )}
          wrapperStyle={{ paddingTop: 12 }}
        />
        {/* Confidence band (area between lower and upper) */}
        {showConfidenceBands && (
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#confGrad)"
            name="upper bound"
            legendType="none"
            dot={false}
            activeDot={false}
          />
        )}
        {showConfidenceBands && (
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#020a0f"
            name="lower bound"
            legendType="none"
            dot={false}
            activeDot={false}
          />
        )}
        {/* Actual */}
        <Area
          type="monotone"
          dataKey="actual"
          name="actual"
          stroke="#06b6d4"
          strokeWidth={2}
          fill="url(#actualGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#06b6d4', stroke: '#020a0f', strokeWidth: 2 }}
          connectNulls={false}
        />
        {/* Predicted */}
        <Area
          type="monotone"
          dataKey="predicted"
          name="forecast"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          fill="url(#predictedGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#f59e0b', stroke: '#020a0f', strokeWidth: 2 }}
        />
        {/* Forecast boundary */}
        {lastActualIndex >= 0 && (
          <ReferenceLine
            x={formatted[lastActualIndex]?.time}
            stroke="#1c618f"
            strokeDasharray="3 3"
            label={{ value: 'NOW', position: 'top', fill: '#3e9ecf', fontSize: 10 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
});
