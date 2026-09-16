import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Sliders, Globe } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, DataRow } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';

export default function SettingsPage() {
  const { settings, updateSettings, theme, setTheme } = useAppStore();
  const [tab, setTab] = useState('thresholds');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs = [
    { id: 'thresholds', label: 'Thresholds' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'display', label: 'Display & Units' },
    { id: 'roles', label: 'Roles & Access' },
  ];

  function NumberInput({ label, value, onChange, unit, min, max }: { label: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number }) {
    return (
      <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-800/40 last:border-0">
        <label className="text-xs text-slate-400">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            min={min}
            max={max}
            className="w-20 bg-slate-800/60 border border-slate-700/50 text-slate-200 text-xs rounded-md px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-cyan-500/50 font-mono"
            aria-label={label}
          />
          {unit && <span className="text-xs text-slate-500 w-6">{unit}</span>}
        </div>
      </div>
    );
  }

  function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
    return (
      <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-800/40 last:border-0">
        <div>
          <p className="text-xs text-slate-300">{label}</p>
          {description && <p className="text-[11px] text-slate-600">{description}</p>}
        </div>
        <button
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${checked ? 'bg-cyan-600' : 'bg-slate-700'}`}
          style={{ height: '22px' }}
          aria-label={label}
        >
          <span
            className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
            style={{ width: '18px', height: '18px', top: '2px', transform: checked ? 'translateX(20px)' : 'translateX(2px)' }}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 max-w-[800px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">System configuration and preferences</p>
        </div>
        <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={handleSave} loading={saved}>
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'thresholds' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Alert Thresholds" icon={<Sliders size={15} />} subtitle="Triggers for system alerts" />
            <div>
              <NumberInput label="Fuel low warning" value={settings.alertThresholds.fuelLowPct} onChange={(v) => updateSettings({ alertThresholds: { ...settings.alertThresholds, fuelLowPct: v } })} unit="%" min={5} max={50} />
              <NumberInput label="Battery SOC warning" value={settings.alertThresholds.batteryLowPct} onChange={(v) => updateSettings({ alertThresholds: { ...settings.alertThresholds, batteryLowPct: v } })} unit="%" min={5} max={50} />
              <NumberInput label="Battery reserve minimum" value={settings.alertThresholds.batteryReservePct} onChange={(v) => updateSettings({ alertThresholds: { ...settings.alertThresholds, batteryReservePct: v } })} unit="%" min={10} max={60} />
              <NumberInput label="Generator high load warning" value={settings.alertThresholds.generatorHighLoadPct} onChange={(v) => updateSettings({ alertThresholds: { ...settings.alertThresholds, generatorHighLoadPct: v } })} unit="%" min={70} max={100} />
              <NumberInput label="Max generator temperature" value={settings.alertThresholds.maxTemperatureCelsius} onChange={(v) => updateSettings({ alertThresholds: { ...settings.alertThresholds, maxTemperatureCelsius: v } })} unit="°C" min={80} max={120} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Forecast Settings" icon={<Sliders size={15} />} />
            <div>
              <NumberInput label="Auto-refresh interval" value={settings.forecastSettings.autoRefreshMinutes} onChange={(v) => updateSettings({ forecastSettings: { ...settings.forecastSettings, autoRefreshMinutes: v } })} unit="min" min={1} max={60} />
              <Toggle
                label="Show confidence bands on forecast charts"
                checked={settings.forecastSettings.showConfidenceBands}
                onChange={(v) => updateSettings({ forecastSettings: { ...settings.forecastSettings, showConfidenceBands: v } })}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader title="Notification Preferences" icon={<Bell size={15} />} />
          <div>
            <Toggle label="Critical alerts" checked={settings.notificationPreferences.criticalAlerts} onChange={(v) => updateSettings({ notificationPreferences: { ...settings.notificationPreferences, criticalAlerts: v } })} description="Always enabled for safety" />
            <Toggle label="High severity alerts" checked={settings.notificationPreferences.highAlerts} onChange={(v) => updateSettings({ notificationPreferences: { ...settings.notificationPreferences, highAlerts: v } })} />
            <Toggle label="Medium severity alerts" checked={settings.notificationPreferences.mediumAlerts} onChange={(v) => updateSettings({ notificationPreferences: { ...settings.notificationPreferences, mediumAlerts: v } })} />
            <Toggle label="Email notifications" checked={settings.notificationPreferences.emailAlerts} onChange={(v) => updateSettings({ notificationPreferences: { ...settings.notificationPreferences, emailAlerts: v } })} description="Requires backend integration" />
            <Toggle label="Sound alerts" checked={settings.notificationPreferences.soundAlerts} onChange={(v) => updateSettings({ notificationPreferences: { ...settings.notificationPreferences, soundAlerts: v } })} />
          </div>
        </Card>
      )}

      {tab === 'display' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Display Settings" icon={<Globe size={15} />} />
            <div>
              <Toggle label="Dark mode" checked={theme === 'dark'} onChange={(v) => setTheme(v ? 'dark' : 'light')} description="Recommended for operational environments" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Units" icon={<Sliders size={15} />} />
            <div className="space-y-2 text-xs text-slate-500 py-2">
              <DataRow label="Power unit" value="MW (megawatts)" mono={false} />
              <DataRow label="Energy unit" value="MWh (megawatt-hours)" mono={false} />
              <DataRow label="Temperature" value="°C (Celsius)" mono={false} />
              <DataRow label="Fuel volume" value="Liters" mono={false} />
              <DataRow label="Wind speed" value="m/s (meters per second)" mono={false} />
              <p className="text-xs text-slate-600 pt-2">Unit switching will be available in a future update.</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'roles' && (
        <Card>
          <CardHeader title="Role Permissions" icon={<Shield size={15} />} subtitle="Feature access by role" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs" role="table">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-slate-500 py-2 pr-4">Feature</th>
                  {['Admin', 'Engineer', 'Operator', 'Researcher', 'Viewer'].map((r) => (
                    <th key={r} className="text-center text-slate-400 py-2 px-3">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {[
                  { feature: 'View dashboards', access: [true, true, true, true, true] },
                  { feature: 'Accept AI recommendations', access: [true, true, true, false, false] },
                  { feature: 'Start/stop generators', access: [true, true, true, false, false] },
                  { feature: 'Modify schedules', access: [true, true, false, false, false] },
                  { feature: 'Manage alerts', access: [true, true, true, false, false] },
                  { feature: 'Configure thresholds', access: [true, true, false, false, false] },
                  { feature: 'User management', access: [true, false, false, false, false] },
                  { feature: 'System settings', access: [true, true, false, false, false] },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="text-slate-400 py-2 pr-4">{row.feature}</td>
                    {row.access.map((a, i) => (
                      <td key={i} className="text-center py-2 px-3">
                        <span className={a ? 'text-emerald-400' : 'text-slate-700'}>{a ? '✓' : '✕'}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
