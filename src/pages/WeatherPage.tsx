import React, { useMemo } from 'react';
import { CloudSnow, Thermometer, Wind, Eye, Droplets, Sun } from 'lucide-react';
import { useWeatherData, useWeatherHistory, useWeatherForecast7d } from '@/hooks';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, DataRow, Skeleton } from '@/components/ui';
import { EnergyHistoryChart } from '@/charts';
import { windDirectionLabel, formatWindSpeed, formatTemp } from '@/utils/calculations';
import { format } from 'date-fns';

function WeatherIcon({ code }: { code: string }) {
  if (code.includes('CLOUDY') || code.includes('OVERCAST')) return <CloudSnow size={20} className="text-slate-400" />;
  if (code.includes('CLEAR')) return <Sun size={20} className="text-amber-400" />;
  return <CloudSnow size={20} className="text-blue-300" />;
}

export default function WeatherPage() {
  const { data: weather } = useWeatherData();
  const { data: history } = useWeatherHistory();
  const { data: forecast7d } = useWeatherForecast7d();

  const tempHistory = useMemo(() => history?.map((h, i) => ({ timestamp: h.timestamp, actual: h.temperatureCelsius, label: `${i}h` })) ?? [], [history]);
  const windHistory = useMemo(() => history?.map((h, i) => ({ timestamp: h.timestamp, actual: h.windSpeedMs, label: `${i}h` })) ?? [], [history]);

  const riskColors: Record<string, string> = {
    NORMAL: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    WATCH: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    WARNING: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
    CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Weather & Environmental Conditions</h1>
        <p className="text-xs text-slate-500 mt-0.5">Polar Research Station Alpha — Queen Maud Land, Antarctica</p>
      </div>

      {/* Current conditions */}
      {weather ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main weather card */}
          <Card className="md:col-span-2">
            <CardHeader title="Current Conditions" subtitle={`${weather.weatherDescription} — ${format(new Date(weather.timestamp), 'HH:mm UTC')}`} icon={<WeatherIcon code={weather.weatherCode} />} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <p className="text-2xl font-bold font-mono text-slate-100">{weather.solarIrradianceWm2}</p>
                <p className="text-xs text-slate-500">Irradiance (W/m²)</p>
                <p className="text-[11px] text-slate-600">Cloud: {weather.cloudCoverPercent}%</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-3 text-center">
                <Eye size={16} className="text-slate-400 mx-auto mb-1" aria-hidden="true" />
                <p className="text-2xl font-bold font-mono text-slate-100">{weather.visibilityKm.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Visibility (km)</p>
                <p className="text-[11px] text-slate-600">Snow: {weather.snowfallCmh.toFixed(1)} cm/h</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <DataRow label="Pressure" value={`${weather.pressureHpa.toFixed(0)} hPa`} />
              <DataRow label="Humidity" value={`${weather.humidityPercent}%`} />
              <DataRow label="Warning level" value={`Level ${weather.policeWarningLevel}`} mono={false} />
            </div>
          </Card>

          {/* Energy impact */}
          <Card>
            <CardHeader title="Energy Impact" icon={<Droplets size={15} />} />
            <div className={`border rounded-xl p-3 mb-3 ${riskColors[weather.energyImpact.overallRiskLevel]}`}>
              <p className="text-xs font-bold mb-1">Overall Risk: {weather.energyImpact.overallRiskLevel}</p>
              <p className="text-xs leading-relaxed opacity-90">{weather.energyImpact.description}</p>
            </div>
            <div className="space-y-0">
              <DataRow label="Heating load increase" value={`+${weather.energyImpact.heatingLoadIncreaseMW.toFixed(2)} MW`} />
              <DataRow label="Solar impact" value={`${weather.energyImpact.solarGenerationImpactPct}%`} />
              <DataRow label="Wind impact" value={`+${weather.energyImpact.windGenerationImpactPct}%`} />
            </div>
          </Card>
        </div>
      ) : <Skeleton className="h-64 rounded-xl" />}

      {/* 7-day forecast */}
      {forecast7d && (
        <Card>
          <CardHeader title="7-Day Weather Forecast" icon={<CloudSnow size={15} />} />
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
                <p className="text-[10px] text-slate-500 mt-1">{day.windSpeedMs.toFixed(1)} m/s</p>
                <p className="text-[10px] text-slate-600">{day.cloudCoverPct}% cloud</p>
                <div className="mt-1.5">
                  <Badge variant={day.energyRisk === 'WARNING' ? 'warning' : day.energyRisk === 'WATCH' ? 'info' : 'success'} size="sm">
                    {day.energyRisk}
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
          <CardHeader title="Temperature (24h)" icon={<Thermometer size={15} />} />
          {tempHistory.length > 0 ? (
            <EnergyHistoryChart data={tempHistory} unit="°C" height={180} color="#60a5fa" />
          ) : <Skeleton className="h-44" />}
        </Card>
        <Card>
          <CardHeader title="Wind Speed (24h)" icon={<Wind size={15} />} />
          {windHistory.length > 0 ? (
            <EnergyHistoryChart data={windHistory} unit=" m/s" height={180} color="#34d399" />
          ) : <Skeleton className="h-44" />}
        </Card>
      </div>
    </div>
  );
}
