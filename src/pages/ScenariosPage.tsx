import React, { useState, useMemo } from 'react';
import { FlaskConical, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, DataRow } from '@/components/ui';
import type { ScenarioInput, ScenarioResult } from '@/types';
import { fuelRuntime, formatFuelRuntime, renewableContribution } from '@/utils/calculations';

// Base scenario values (current state)
const BASE_VALUES = {
  loadMW: 2.84,
  solarMW: 0.48,
  windMW: 0.64,
  fuelLiters: 34000,
  fuelRateLph: 87.4,
  batterySOC: 74,
  temperatureC: -18.4,
  generatorsOnline: 2,
};

const PRESET_SCENARIOS: { name: string; label: string; changes: Partial<ScenarioInput> }[] = [
  { name: 'blizzard', label: 'Blizzard (Sept 18)', changes: { solarChangePct: -90, windChangePct: 20, loadChangePct: 15, temperatureChangeCelsius: -8 } },
  { name: 'solarDrop', label: 'Solar drops 30%', changes: { solarChangePct: -30 } },
  { name: 'tempDrop', label: 'Temperature -10°C', changes: { temperatureChangeCelsius: -10, loadChangePct: 12 } },
  { name: 'genFail', label: 'G-01 fails', changes: { generatorsOnline: 1 } },
  { name: 'loadIncrease', label: 'Load +20%', changes: { loadChangePct: 20 } },
  { name: 'fuelDelay', label: 'Fuel delay 24h', changes: { fuelAvailabilityPct: -18 } },
];

function computeScenario(input: ScenarioInput): ScenarioResult {
  const solar = BASE_VALUES.solarMW * (1 + input.solarChangePct / 100);
  const wind = BASE_VALUES.windMW * (1 + input.windChangePct / 100);
  const load = BASE_VALUES.loadMW * (1 + input.loadChangePct / 100);
  const tempEffect = Math.max(0, -input.temperatureChangeCelsius) * 0.04; // each -1°C adds ~40kW heating
  const effectiveLoad = load + tempEffect;
  const renewable = solar + wind;
  const generatorCapacity = Math.min(2.0, input.generatorsOnline * 1.0);
  const generatorOutput = Math.min(generatorCapacity, Math.max(0, effectiveLoad - renewable - 0.25));
  const balance = renewable + generatorOutput - effectiveLoad;
  const fuelAvailable = BASE_VALUES.fuelLiters * (1 + (input.fuelAvailabilityPct ?? 0) / 100);
  const fuelRate = BASE_VALUES.fuelRateLph * (generatorOutput / Math.max(0.1, BASE_VALUES.loadMW - BASE_VALUES.solarMW - BASE_VALUES.windMW));
  const rtHours = fuelRuntime(fuelAvailable, fuelRate);
  const energyShortfall = balance < 0 ? Math.abs(balance) * input.durationHours : 0;
  const genRuntime = input.durationHours;
  const fuelUsage = fuelRate * genRuntime;
  const batteryDepletionHours = BASE_VALUES.batterySOC > 35 ? (BASE_VALUES.batterySOC - 35) / 100 * 18.64 / Math.max(0.01, -balance) : undefined;
  const criticalLoadSafe = effectiveLoad <= (renewable + generatorCapacity + 0.5);
  const overallStatus = energyShortfall > 1 ? 'CRITICAL' : energyShortfall > 0 ? 'STRESSED' : 'NORMAL';

  const risks: string[] = [];
  if (solar < 0.1) risks.push('Solar generation near zero');
  if (input.generatorsOnline < 2) risks.push('Reduced generator capacity');
  if (effectiveLoad > renewable + generatorCapacity) risks.push('Load exceeds total generation capacity');
  if (fuelAvailable < 15000) risks.push('Low fuel reserve');
  if (input.temperatureChangeCelsius < -5) risks.push('Extreme cold — elevated heating demand');

  return {
    name: input.name,
    fuelUsageLiters: fuelUsage,
    batteryDepletionTime: batteryDepletionHours !== undefined && batteryDepletionHours < 24
      ? `${Math.floor(batteryDepletionHours)}h ${Math.round((batteryDepletionHours % 1) * 60)}m`
      : undefined,
    energyShortfallMWh: energyShortfall,
    renewableContributionPct: renewableContribution(renewable, effectiveLoad),
    generatorRuntimeHours: genRuntime,
    criticalLoadSafe,
    overallStatus,
    risks,
    summary: overallStatus === 'CRITICAL'
      ? 'Critical: Station energy security compromised. Immediate action required.'
      : overallStatus === 'STRESSED'
      ? 'Watch: Energy balance is tight. Monitor closely and reduce non-critical loads.'
      : 'Normal: Station can maintain operations under these conditions.',
  };
}

const DEFAULT_INPUT: ScenarioInput = {
  name: 'Custom Scenario',
  loadChangePct: 0,
  solarChangePct: 0,
  windChangePct: 0,
  temperatureChangeCelsius: 0,
  fuelAvailabilityPct: 0,
  batteryCapacityPct: 100,
  generatorsOnline: 2,
  durationHours: 6,
};

export default function ScenariosPage() {
  const [input, setInput] = useState<ScenarioInput>(DEFAULT_INPUT);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const baseResult = useMemo(() => computeScenario({ ...DEFAULT_INPUT, name: 'Current Plan' }), []);
  const scenarioResult = useMemo(() => computeScenario(input), [input]);

  function applyPreset(preset: typeof PRESET_SCENARIOS[0]) {
    setActivePreset(preset.name);
    setInput({ ...DEFAULT_INPUT, name: preset.label, ...preset.changes });
  }

  function reset() {
    setInput(DEFAULT_INPUT);
    setActivePreset(null);
  }

  function SliderInput({ label, field, min, max, step = 1, unit = '%' }: {
    label: string;
    field: keyof ScenarioInput;
    min: number;
    max: number;
    step?: number;
    unit?: string;
  }) {
    const value = input[field] as number;
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <label className="text-slate-400" htmlFor={`slider-${field}`}>{label}</label>
          <span className={`font-mono font-semibold ${(value as number) > 0 ? 'text-amber-400' : (value as number) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {(value as number) > 0 ? '+' : ''}{value}{unit}
          </span>
        </div>
        <input
          id={`slider-${field}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setInput((prev) => ({ ...prev, [field]: parseFloat(e.target.value) }))}
          className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
          aria-label={label}
        />
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    NORMAL: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400',
    STRESSED: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    CRITICAL: 'border-red-500/40 bg-red-500/12 text-red-400',
  };

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Scenario Simulator</h1>
        <p className="text-xs text-slate-500 mt-0.5">What-if analysis — adjust parameters to simulate different conditions</p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-2.5 text-xs text-slate-400">
        <FlaskConical size={13} className="text-blue-400 shrink-0" />
        Simulations use frontend-only calculations based on mock data. Results are indicative only and should not be used for actual operational planning without real data integration.
      </div>

      {/* Preset buttons */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preset Scenarios</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SCENARIOS.map((p) => (
            <Button
              key={p.name}
              variant={activePreset === p.name ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>Reset</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Controls */}
        <Card>
          <CardHeader title="Scenario Parameters" icon={<FlaskConical size={15} />} />
          <div className="space-y-4">
            <SliderInput label="Load change" field="loadChangePct" min={-50} max={100} />
            <SliderInput label="Solar generation change" field="solarChangePct" min={-100} max={50} />
            <SliderInput label="Wind generation change" field="windChangePct" min={-50} max={100} />
            <SliderInput label="Temperature change" field="temperatureChangeCelsius" min={-20} max={10} unit="°C" />
            <SliderInput label="Fuel availability change" field="fuelAvailabilityPct" min={-100} max={50} />
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-400" htmlFor="gen-count">Generators online</label>
                <span className="font-mono font-semibold text-slate-300">{input.generatorsOnline}</span>
              </div>
              <input
                id="gen-count"
                type="range" min={0} max={3} step={1}
                value={input.generatorsOnline}
                onChange={(e) => setInput((prev) => ({ ...prev, generatorsOnline: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                aria-label="Generators online"
              />
            </div>
            <SliderInput label="Simulation duration" field="durationHours" min={1} max={72} unit="h" />
          </div>
        </Card>

        {/* Current Plan */}
        <Card>
          <CardHeader title="Current Plan" subtitle="Baseline (no changes)" />
          <div className={`border rounded-xl p-3 mb-4 ${statusStyles[baseResult.overallStatus]}`}>
            <p className="text-sm font-bold">{baseResult.overallStatus}</p>
            <p className="text-xs mt-1 opacity-90">{baseResult.summary}</p>
          </div>
          <div className="space-y-0">
            <DataRow label="Renewable contribution" value={`${baseResult.renewableContributionPct.toFixed(1)}%`} />
            <DataRow label="Fuel usage (period)" value={`${baseResult.fuelUsageLiters.toFixed(0)} L`} />
            <DataRow label="Energy shortfall" value={baseResult.energyShortfallMWh > 0 ? `${baseResult.energyShortfallMWh.toFixed(2)} MWh` : 'None'} />
            <DataRow label="Critical loads safe" value={baseResult.criticalLoadSafe ? 'Yes ✓' : 'At Risk ✗'} />
            {baseResult.batteryDepletionTime && (
              <DataRow label="Battery depletion in" value={baseResult.batteryDepletionTime} />
            )}
          </div>
          {baseResult.risks.length === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-3">
              <CheckCircle2 size={12} />
              No significant risks identified
            </div>
          )}
        </Card>

        {/* Scenario Result */}
        <Card>
          <CardHeader title="Scenario Result" subtitle={input.name} />
          <div className={`border rounded-xl p-3 mb-4 ${statusStyles[scenarioResult.overallStatus]}`}>
            <p className="text-sm font-bold">{scenarioResult.overallStatus}</p>
            <p className="text-xs mt-1 opacity-90">{scenarioResult.summary}</p>
          </div>
          <div className="space-y-0">
            <DataRow label="Renewable contribution" value={`${scenarioResult.renewableContributionPct.toFixed(1)}%`} />
            <DataRow label="Fuel usage (period)" value={`${scenarioResult.fuelUsageLiters.toFixed(0)} L`} />
            <DataRow
              label="Energy shortfall"
              value={scenarioResult.energyShortfallMWh > 0 ? `${scenarioResult.energyShortfallMWh.toFixed(2)} MWh` : 'None'}
            />
            <DataRow label="Critical loads safe" value={scenarioResult.criticalLoadSafe ? 'Yes ✓' : 'At Risk ✗'} />
            {scenarioResult.batteryDepletionTime && (
              <DataRow label="Battery depletion in" value={scenarioResult.batteryDepletionTime} />
            )}
          </div>
          {/* Risks */}
          {scenarioResult.risks.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">Identified Risks</p>
              {scenarioResult.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                  <AlertTriangle size={11} className="shrink-0 mt-0.5" aria-hidden="true" />
                  {r}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Comparison table */}
      <Card>
        <CardHeader title="Scenario Comparison" subtitle="Current plan vs. scenario" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="table">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="text-left text-slate-500 font-medium py-2 pr-4">Metric</th>
                <th className="text-right text-slate-400 py-2 px-4">Current Plan</th>
                <th className="text-right text-slate-300 py-2 px-4">Scenario</th>
                <th className="text-right text-slate-500 py-2 pl-4">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {[
                { label: 'Renewable contribution', base: baseResult.renewableContributionPct.toFixed(1) + '%', scenario: scenarioResult.renewableContributionPct.toFixed(1) + '%', diff: scenarioResult.renewableContributionPct - baseResult.renewableContributionPct, unit: '%' },
                { label: 'Fuel usage', base: baseResult.fuelUsageLiters.toFixed(0) + ' L', scenario: scenarioResult.fuelUsageLiters.toFixed(0) + ' L', diff: scenarioResult.fuelUsageLiters - baseResult.fuelUsageLiters, unit: ' L' },
                { label: 'Energy shortfall', base: baseResult.energyShortfallMWh.toFixed(2) + ' MWh', scenario: scenarioResult.energyShortfallMWh.toFixed(2) + ' MWh', diff: scenarioResult.energyShortfallMWh - baseResult.energyShortfallMWh, unit: ' MWh' },
                { label: 'Critical loads', base: baseResult.criticalLoadSafe ? 'Safe' : 'At Risk', scenario: scenarioResult.criticalLoadSafe ? 'Safe' : 'At Risk', diff: null, unit: '' },
              ].map((row) => (
                <tr key={row.label} className="py-2">
                  <td className="text-slate-400 py-2 pr-4">{row.label}</td>
                  <td className="text-right font-mono text-slate-300 py-2 px-4">{row.base}</td>
                  <td className={`text-right font-mono py-2 px-4 ${scenarioResult.overallStatus === 'CRITICAL' ? 'text-red-400' : 'text-slate-200'}`}>{row.scenario}</td>
                  <td className="text-right py-2 pl-4">
                    {row.diff !== null ? (
                      <span className={`font-mono ${row.diff > 0 ? 'text-red-400' : row.diff < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {row.diff > 0 ? '+' : ''}{row.diff.toFixed(1)}{row.unit}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
