import React, { memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { format } from 'date-fns';

// ---- Energy History Chart ----------------------------------

interface EnergyHistoryChartProps {
  data: Array<{ timestamp: string; actual: number; label?: string }>;
  unit?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export const EnergyHistoryChart = memo(function EnergyHistoryChart({
  data,
  unit = 'MW',
  height = 200,
  color = '#06b6d4',
  showGrid = true,
}: EnergyHistoryChartProps) {
  const formatted = data.map((d) => ({
    time: d.label ?? format(new Date(d.timestamp), 'HH:mm'),
    value: d.actual,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.18} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#0a2233" vertical={false} />}
        <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(1)} unit={unit} width={44} />
        <Tooltip
          contentStyle={{ backgroundColor: '#041219', border: '1px solid #0a2233', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: color }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name={unit}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: '#020a0f', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// ---- SOC Chart (Battery) ----------------------------------

interface SOCChartProps {
  data: Array<{ timestamp: string; socPercent: number; isForecasted: boolean }>;
  height?: number;
}

export const SOCChart = memo(function SOCChart({ data, height = 200 }: SOCChartProps) {
  const formatted = data.map((d) => ({
    time: format(new Date(d.timestamp), 'HH:mm'),
    soc: d.socPercent,
    isForecasted: d.isForecasted,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0a2233" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" width={36} />
        <Tooltip
          contentStyle={{ backgroundColor: '#041219', border: '1px solid #0a2233', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#818cf8' }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, 'SOC']}
        />
        <Area
          type="monotone"
          dataKey="soc"
          name="SOC"
          stroke="#818cf8"
          strokeWidth={2}
          fill="url(#socGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#818cf8', stroke: '#020a0f', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// ---- Load Distribution Chart (Bar) -------------------------

interface LoadDistributionChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
}

export const LoadDistributionChart = memo(function LoadDistributionChart({ data, height = 180 }: LoadDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0a2233" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} unit=" MW" />
        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
        <Tooltip
          contentStyle={{ backgroundColor: '#041219', border: '1px solid #0a2233', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(v: number) => [`${v.toFixed(2)} MW`, 'Load']}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ---- Energy Donut Chart ------------------------------------

interface EnergyDonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  size?: number;
}

export const EnergyDonutChart = memo(function EnergyDonutChart({ data, size = 160 }: EnergyDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={size * 0.28}
          outerRadius={size * 0.44}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#041219', border: '1px solid #0a2233', borderRadius: '8px', fontSize: '11px' }}
          formatter={(v: number) => [`${v.toFixed(2)} MW`, '']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

// ---- Renewable Stacked Chart --------------------------------

interface RenewableChartProps {
  data: Array<{ timestamp: string; solar: number; wind: number; total: number; isFuture: boolean }>;
  height?: number;
}

export const RenewableChart = memo(function RenewableChart({ data, height = 220 }: RenewableChartProps) {
  const formatted = data.map((d) => ({
    time: format(new Date(d.timestamp), 'HH:mm'),
    solar: d.solar,
    wind: d.wind,
    isFuture: d.isFuture,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0a2233" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} unit=" MW" width={44} />
        <Tooltip
          contentStyle={{ backgroundColor: '#041219', border: '1px solid #0a2233', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={(v) => <span style={{ color: '#94a3b8' }}>{v}</span>} />
        <Area type="monotone" dataKey="solar" name="Solar" stroke="#fbbf24" strokeWidth={1.5} fill="url(#solarGrad)" dot={false} stackId="1" />
        <Area type="monotone" dataKey="wind" name="Wind" stroke="#34d399" strokeWidth={1.5} fill="url(#windGrad)" dot={false} stackId="1" />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// ---- Fuel Level Chart --------------------------------------

interface FuelChartProps {
  data: Array<{ timestamp: string; levelLiters: number; levelPercent: number; scenarioType: string }>;
  height?: number;
}

export const FuelLevelChart = memo(function FuelLevelChart({ data, height = 200 }: FuelChartProps) {
  const colors: Record<string, string> = {
    OBSERVED: '#06b6d4',
    FORECAST: '#f59e0b',
    OPTIMIZED: '#34d399',
  };

  const formatted = data.map((d) => ({
    time: format(new Date(d.timestamp), 'dd/MM HH:mm'),
    pct: d.levelPercent,
    type: d.scenarioType,
    color: colors[d.scenarioType] ?? '#94a3b8',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="fuelObsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0a2233" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" width={36} />
        <Tooltip
          contentStyle={{ backgroundColor: '#041219', border: '1px solid #0a2233', borderRadius: '8px', fontSize: '11px' }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, 'Fuel Level']}
        />
        <Area type="monotone" dataKey="pct" name="Fuel Level" stroke="#f59e0b" strokeWidth={2} fill="url(#fuelObsGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// ---- Mini Sparkline ----------------------------------------

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const Sparkline = memo(function Sparkline({ data, color = '#06b6d4', height = 32 }: SparklineProps) {
  const formatted = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
});
