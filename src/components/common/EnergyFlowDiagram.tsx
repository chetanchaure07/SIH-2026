import React, { memo } from 'react';
import { Sun, Wind, Battery, Zap, Server, Thermometer, Monitor, Radio, Heart } from 'lucide-react';

interface FlowNodeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

function FlowNode({ icon, label, value, color, bgColor }: FlowNodeProps) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${bgColor} border rounded-xl p-3 min-w-[90px]`} style={{ borderColor: color + '40' }}>
      <div style={{ color }} aria-hidden="true">{icon}</div>
      <span className="text-[10px] font-medium text-slate-400 text-center leading-tight">{label}</span>
      <span className="text-xs font-bold text-data" style={{ color }}>{value}</span>
    </div>
  );
}

interface FlowArrowProps {
  value: string;
  active: boolean;
  direction?: 'down' | 'right';
  color?: string;
}

function FlowArrow({ value, active, direction = 'down', color = '#06b6d4' }: FlowArrowProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-0.5">
      <span className="text-[10px] font-mono text-slate-500">{value}</span>
      {direction === 'down' ? (
        <div className="flex flex-col items-center gap-0">
          <div className={`w-0.5 h-5 rounded ${active ? 'opacity-80' : 'opacity-20'}`} style={{ backgroundColor: color }} aria-hidden="true" />
          <div className="w-0 h-0" style={{
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `6px solid ${active ? color : '#334155'}`,
            opacity: active ? 0.8 : 0.2,
          }} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}

interface EnergyFlowProps {
  solar: number;
  wind: number;
  battery: number;      // positive = charging, negative = discharging
  generator: number;
  load: number;
  criticalLoad: number;
  essentialLoad: number;
  nonCriticalLoad: number;
}

export const EnergyFlowDiagram = memo(function EnergyFlowDiagram({
  solar,
  wind,
  battery,
  generator,
  load,
  criticalLoad,
  essentialLoad,
  nonCriticalLoad,
}: EnergyFlowProps) {
  const batteryDischarging = battery < -0.05;
  const batteryCharging = battery > 0.05;

  return (
    <div className="flex flex-col items-center gap-1 select-none" role="img" aria-label="Energy flow diagram">
      {/* Sources row */}
      <div className="flex items-end justify-center gap-4">
        <FlowNode
          icon={<Sun size={18} />}
          label="Solar"
          value={`${solar.toFixed(2)} MW`}
          color="#fbbf24"
          bgColor="bg-[#1c1400]/60"
        />
        <FlowNode
          icon={<Wind size={18} />}
          label="Wind"
          value={`${wind.toFixed(2)} MW`}
          color="#34d399"
          bgColor="bg-[#002214]/60"
        />
        <FlowNode
          icon={<Server size={18} />}
          label="Generator"
          value={`${generator.toFixed(2)} MW`}
          color="#fb923c"
          bgColor="bg-[#1a0900]/60"
        />
      </div>

      <FlowArrow value={`${(solar + wind + generator).toFixed(2)} MW`} active={true} color="#06b6d4" />

      {/* Main bus */}
      <div className="bg-[#041219] border border-[#0d2b3f] rounded-xl px-8 py-3 w-full max-w-xs text-center">
        <div className="flex items-center justify-center gap-2">
          <Zap size={14} className="text-cyan-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-cyan-400">Main Distribution Bus</span>
        </div>
        <p className="text-xs text-data text-slate-300 mt-1">{(solar + wind + generator).toFixed(2)} MW available</p>
      </div>

      {/* Battery side node */}
      <div className="flex items-center gap-4 w-full max-w-sm">
        <div className="flex-1 h-0.5 bg-violet-500/30" aria-hidden="true" />
        <div className={`bg-[#08001a]/60 border rounded-xl p-3 text-center ${batteryDischarging ? 'border-violet-500/40' : batteryCharging ? 'border-cyan-500/40' : 'border-slate-800/40'}`}>
          <Battery size={16} className={batteryDischarging ? 'text-violet-400' : batteryCharging ? 'text-cyan-400' : 'text-slate-500'} aria-hidden="true" />
          <p className="text-[10px] text-slate-400 mt-1">Battery</p>
          <p className="text-xs font-bold font-mono text-violet-400">
            {batteryDischarging ? `↑ ${Math.abs(battery).toFixed(2)}` : batteryCharging ? `↓ ${battery.toFixed(2)}` : 'IDLE'} MW
          </p>
          <p className="text-[10px] text-slate-600">{batteryDischarging ? 'Discharging' : batteryCharging ? 'Charging' : ''}</p>
        </div>
        <div className="flex-1 h-0.5 bg-violet-500/30" aria-hidden="true" />
      </div>

      <FlowArrow value={`${load.toFixed(2)} MW`} active={true} color="#f472b6" />

      {/* Loads row */}
      <div className="flex items-start justify-center gap-3 w-full">
        <div className="flex flex-col items-center gap-1">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-center">
            <Heart size={14} className="text-red-400 mx-auto" aria-hidden="true" />
            <p className="text-[10px] text-slate-400 mt-1">Critical</p>
            <p className="text-xs font-bold font-mono text-red-400">{criticalLoad.toFixed(2)} MW</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 text-center">
            <Radio size={14} className="text-amber-400 mx-auto" aria-hidden="true" />
            <p className="text-[10px] text-slate-400 mt-1">Essential</p>
            <p className="text-xs font-bold font-mono text-amber-400">{essentialLoad.toFixed(2)} MW</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-2.5 text-center">
            <Monitor size={14} className="text-slate-400 mx-auto" aria-hidden="true" />
            <p className="text-[10px] text-slate-400 mt-1">Non-critical</p>
            <p className="text-xs font-bold font-mono text-slate-400">{nonCriticalLoad.toFixed(2)} MW</p>
          </div>
        </div>
      </div>
    </div>
  );
});
