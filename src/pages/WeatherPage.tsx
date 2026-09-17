import React, { useMemo, useState } from 'react';
import { CloudSnow, Thermometer, Wind, Sun, ChevronDown, ChevronUp } from 'lucide-react';
import { useWeatherData, useWeatherHistory, useWeatherForecast7d } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, DataRow, Skeleton } from '@/components/ui';
import { EnergyHistoryChart } from '@/charts';
import { windDirectionLabel } from '@/utils/calculations';
import { format } from 'date-fns';

function WeatherIcon({ code }: { code: string }) {
  if (code.includes('CLOUDY') || code.includes('OVERCAST')) return <CloudSnow size={20} className="text-slate-400" />;
  if (code.includes('CLEAR')) return <Sun size={20} className="text-amber-400" />;
  return <CloudSnow size={20} className="text-blue-300" />;
}

function ImpactRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl p-3.5 border ${color}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-semibold mb-0.5">{label}</p>
        <p className="text-xs opacity-80 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const { data: weather } = useWeatherData();
  const { data: history } = useWeatherHistory();
  const { data: forecast7d } = useWeatherForecast7d();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tempHistory = useMemo(() => history?.map((h, i) => ({ timestamp: h.timestamp, actual: h.temperatureCelsius, label: `${i}h` })) ?? [], [history]);
  const windHistory = useMemo(() => history?.map((h, i) => ({ timestamp: h.timestamp, actual: h.windSpeedMs, label: `${i}h` })) ?? [], [history]);

  // Plain-English energy impact assessments
  const energyImpacts = useMemo(() => {
    if (!weather) return [];
    const impacts: { icon: React.ReactNode; label: string; value: string; color: string }[] = [];

    // Temperature → Heating
    const heatingMW = weather.energyImpact.heatingLoadIncreaseMW;
    if (weather.temperatureCelsius < -20) {
      impacts.push({
        icon: <Thermometer size={16} className="text-red-400" />,
        label: 'Extreme Cold — High Heating Demand',
        value: `Temperature of ${weather.temperatureCelsius.toFixed(1)}°C is causing a significant ${heatingMW.toFixed(2)} MW increase in heating load. Backup reserves should be prioritized.`,
        color: 'border-red-500/30 bg-red-500/5 text-red-300',
      });
    } else if (weather.temperatureCelsius < -10) {
      impacts.push({
        icon: <Thermometer size={16} className="text-amber-400" />,
        label: 'Cold Weather — Elevated Heating Demand',
        value: `Temperature of ${weather.temperatureCelsius.toFixed(1)}°C is adding +${heatingMW.toFixed(2)} MW of heating load compared to normal conditions.`,
        color: 'border-amber-500/25 bg-amber-500/5 text-amber-300',
      });
    } else {
      impacts.push({
        icon: <Thermometer size={16} className="text-emerald-400" />,
        label: 'Mild Cold — Normal Heating Demand',
        value: `Temperature is ${weather.temperatureCelsius.toFixed(1)}°C. Heating load is within normal range (+${heatingMW.toFixed(2)} MW).`,
        color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
      });
    }

    // Wind → Generation
    const windImpact = weather.energyImpact.windGenerationImpactPct;
    if (weather.windSpeedMs > 12) {
      impacts.push({
        icon: <Wind size={16} className="text-emerald-400" />,
        label: 'Strong Wind — Excellent Generation',
        value: `Wind speed of ${weather.windSpeedMs.toFixed(1)} m/s is boosting wind turbine output by +${windImpact}% above baseline.`,
        color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
      });
    } else if (weather.windSpeedMs > 5) {
      impacts.push({
        icon: <Wind size={16} className="text-blue-400" />,
        label: 'Moderate Wind — Adequate Generation',
        value: `Wind speed of ${weather.windSpeedMs.toFixed(1)} m/s is providing +${windImpact}% of wind generation above baseline.`,
        color: 'border-blue-500/20 bg-blue-500/5 text-blue-300',
      });
    } else {
      impacts.push({
        icon: <Wind size={16} className="text-amber-400" />,
        label: 'Low Wind — Reduced Generation',
        value: `Wind speed of ${weather.windSpeedMs.toFixed(1)} m/s is below optimal. Wind generation may not meet expectations.`,
        color: 'border-amber-500/25 bg-amber-500/5 text-amber-300',
      });
    }

    // Solar
    const solarImpact = weather.energyImpact.solarGenerationImpactPct;
    if (weather.cloudCoverPercent > 70) {
      impacts.push({
        icon: <Sun size={16} className="text-slate-400" />,
        label: 'High Cloud Cover — Reduced Solar Output',
        value: `Cloud cover of ${weather.cloudCoverPercent}% is limiting solar panel output (${solarImpact}% impact). Rely more on wind and backup.`,
        color: 'border-slate-700/50 bg-slate-800/30 text-slate-400',
      });
    } else if (weather.cloudCoverPercent > 30) {
      impacts.push({
        icon: <Sun size={16} className="text-amber-400" />,
        label: 'Partial Cloud — Moderate Solar Output',
        value: `Cloud cover of ${weather.cloudCoverPercent}% is partially limiting solar output (${solarImpact}% impact). Generation is adequate.`,
        color: 'border-amber-500/25 bg-amber-500/5 text-amber-300',
      });
    } else {
      impacts.push({
        icon: <Sun size={16} className="text-amber-400" />,
        label: 'Clear Sky — Good Solar Generation',
        value: `Low cloud cover (${weather.cloudCoverPercent}%) means good solar irradiance. Solar panels are performing well (${solarImpact}% impact).`,
        color: 'border-amber-500/20 bg-amber-500/5 text-amber-300',
      });
    }

    return impacts;
  }, [weather]);

  const riskColors: Record<string, string> = {
    NORMAL: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    WATCH: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    WARNING: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
    CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Weather Conditions</h1>
        <p className="text-xs text-slate-500 mt-0.5">Polar Research Station Alpha — Queen Maud Land, Antarctica</p>
      </div>

      {/* Current Conditions */}
      {weather ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main weather card */}
          <Card className="md:col-span-2">
            <CardHeader
              title="Current Conditions"
              subtitle={`${weather.weatherDescription} — ${format(new Date(weather.timestamp), 'HH:mm UTC')}`}
              icon={<WeatherIcon code={weather.weatherCode} />}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3 text-center">
                <Thermometer size={16} className="text-blue-300 mx-auto mb-1" aria-hidden="true" />
                <p className="text-2xl font-bold font-mono text-slate-100">{weather.temperatureCelsius.toFixed(1)}°C</p>
                <p className="text-xs text-slate-500">Temperature</p>
                <p className="text-[11px] text-slate-600">Feels {weather.feelsLikeCelsius.toFixed(1)}°C</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3 text-center">
                <Wind size={16} className="text-emerald-400 mx-auto mb-1" aria-hidden="true" />
                <p className="text-2xl font-bold font-mono text-slate-100">{weather.windSpeedMs.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Wind (m/s)</p>
                <p className="text-[11px] text-slate-600">{windDirectionLabel(weather.windDirectionDeg)} — gusts {weather.windGustMs.toFixed(1)}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3 text-center">
                <Sun size={16} className="text-amber-400 mx-auto mb-1" aria-hidden="true" />
                <p className="text-2xl font-bold font-mono text-slate-100">{weather.cloudCoverPercent}%</p>
                <p className="text-xs text-slate-500">Cloud Cover</p>
                <p className="text-[11px] text-slate-600">Solar: {weather.solarIrradianceWm2} W/m²</p>
              </div>
            </div>

            {/* Advanced weather details - collapsible */}
            <div className="mt-4 border-t border-slate-800/40 pt-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                aria-expanded={showAdvanced}
              >
                {showAdvanced ? 'Hide' : 'Show'} additional measurements
                {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showAdvanced && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <DataRow label="Pressure" value={`${weather.pressureHpa.toFixed(0)} hPa`} />
                  <DataRow label="Humidity" value={`${weather.humidityPercent}%`} />
                  <DataRow label="Visibility" value={`${weather.visibilityKm.toFixed(1)} km`} />
                  <DataRow label="Snowfall" value={`${weather.snowfallCmh.toFixed(1)} cm/h`} />
                  <DataRow label="Warning level" value={`Level ${weather.policeWarningLevel}`} mono={false} />
                </div>
              )}
            </div>
          </Card>

          {/* Overall risk summary */}
          <Card>
            <CardHeader title="Energy Impact Summary" icon={<CloudSnow size={15} />} />
            <div className={`border rounded-xl p-3 mb-4 ${riskColors[weather.energyImpact.overallRiskLevel]}`}>
              <p className="text-xs font-bold mb-1">
                {weather.energyImpact.overallRiskLevel === 'NORMAL' ? '✅ No significant weather risks' :
                 weather.energyImpact.overallRiskLevel === 'WATCH' ? '👀 Weather requires monitoring' :
                 weather.energyImpact.overallRiskLevel === 'WARNING' ? '⚠️ Weather is affecting energy' :
                 '🚨 Severe weather impact'}
              </p>
              <p className="text-xs leading-relaxed opacity-90">{weather.energyImpact.description}</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Heating load increase</span>
                <span className="font-mono text-amber-400">+{weather.energyImpact.heatingLoadIncreaseMW.toFixed(2)} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Solar generation impact</span>
                <span className="font-mono text-slate-300">{weather.energyImpact.solarGenerationImpactPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wind generation impact</span>
                <span className="font-mono text-emerald-400">+{weather.energyImpact.windGenerationImpactPct}%</span>
              </div>
            </div>
          </Card>
        </div>
      ) : <Skeleton className="h-64 rounded-xl" />}

      {/* Plain-English Energy Impacts */}
      {weather && (
        <Card>
          <CardHeader title="What This Weather Means for Energy" subtitle="Plain-language explanation of weather effects on the station" icon={<CloudSnow size={15} />} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {energyImpacts.map((impact, i) => (
              <ImpactRow key={i} {...impact} />
            ))}
          </div>
        </Card>
      )}

      {/* 7-day forecast */}
      {forecast7d && (
        <Card>
          <CardHeader title="7-Day Weather Outlook" icon={<CloudSnow size={15} />} />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {forecast7d.map((day) => (
              <div
                key={day.date}
                className={`rounded-xl p-3 border text-center ${
                  day.energyRisk === 'WARNING' ? 'border-amber-500/25 bg-amber-500/8' :
                  day.energyRisk === 'WATCH' ? 'border-blue-500/20 bg-blue-500/5' :
                  'border-slate-800/50 bg-slate-900/30'
                }`}
              >
                <p className="text-[10px] text-slate-500 mb-1">{format(new Date(day.date), 'EEE dd')}</p>
                <p className="text-sm font-bold text-slate-100">{day.maxTemp}°C</p>
                <p className="text-xs text-slate-600">{day.minTemp}°C</p>
                <p className="text-[10px] text-slate-500 mt-1">{day.windSpeedMs.toFixed(1)} m/s wind</p>
                <div className="mt-1.5">
                  <Badge variant={day.energyRisk === 'WARNING' ? 'warning' : day.energyRisk === 'WATCH' ? 'info' : 'success'} size="sm">
                    {day.energyRisk === 'NORMAL' ? 'Normal' : day.energyRisk === 'WATCH' ? 'Watch' : 'Warning'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historical charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Temperature (Last 24h)" icon={<Thermometer size={15} />} />
          {tempHistory.length > 0 ? (
            <EnergyHistoryChart data={tempHistory} unit="°C" height={180} color="#60a5fa" />
          ) : <Skeleton className="h-44" />}
        </Card>
        <Card>
          <CardHeader title="Wind Speed (Last 24h)" icon={<Wind size={15} />} />
          {windHistory.length > 0 ? (
            <EnergyHistoryChart data={windHistory} unit=" m/s" height={180} color="#34d399" />
          ) : <Skeleton className="h-44" />}
        </Card>
      </div>
    </div>
  );
}
