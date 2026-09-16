import React, { useState, useMemo } from 'react';
import { Bell, Search, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { AlertIcon, Skeleton } from '@/components/ui';
import type { AlertCategory, AlertSeverity, AlertStatus } from '@/types';
import { format } from 'date-fns';

const CATEGORIES: AlertCategory[] = ['ENERGY', 'FUEL', 'BATTERY', 'GENERATOR', 'WEATHER', 'MAINTENANCE', 'SYSTEM'];
const SEVERITIES: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export default function AlertsPage() {
  const { alerts, acknowledgeAlert, resolveAlert, getFilteredAlerts } = useAlertStore();
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus[]>([]);

  const filtered = useMemo(
    () => getFilteredAlerts({ severity: selectedSeverity, category: selectedCategory, status: selectedStatus, search }),
    [alerts, search, selectedSeverity, selectedCategory, selectedStatus, getFilteredAlerts],
  );

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length;

  function toggleSeverity(s: AlertSeverity) {
    setSelectedSeverity((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function toggleCategory(c: AlertCategory) {
    setSelectedCategory((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  return (
    <div className="p-5 space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Alerts & Events</h1>
          <p className="text-xs text-slate-500 mt-0.5">{activeCount} active alerts — {criticalCount} critical</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-red-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs text-red-400 font-semibold">{criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''} Require Attention</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Active', count: alerts.filter((a) => a.status === 'ACTIVE').length, color: 'text-red-400' },
          { label: 'Acknowledged', count: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length, color: 'text-amber-400' },
          { label: 'Resolved', count: alerts.filter((a) => a.status === 'RESOLVED').length, color: 'text-emerald-400' },
          { label: 'Critical', count: alerts.filter((a) => a.severity === 'CRITICAL').length, color: 'text-red-400' },
          { label: 'High', count: alerts.filter((a) => a.severity === 'HIGH').length, color: 'text-orange-400' },
          { label: 'Medium', count: alerts.filter((a) => a.severity === 'MEDIUM').length, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#041219] border border-slate-800/60 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold font-mono ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts..."
            className="w-full bg-slate-800/60 border border-slate-700/50 text-slate-200 text-xs rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 placeholder:text-slate-600"
            aria-label="Search alerts"
          />
        </div>

        {/* Severity filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 shrink-0">Severity:</span>
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSeverity(s)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${selectedSeverity.includes(s) ? 'bg-slate-700 text-slate-100 border-slate-600' : 'text-slate-500 border-slate-800/50 hover:text-slate-300'}`}
              aria-pressed={selectedSeverity.includes(s)}
            >
              {s}
            </button>
          ))}
          {selectedSeverity.length > 0 && (
            <button onClick={() => setSelectedSeverity([])} className="text-xs text-cyan-500 hover:text-cyan-400">Clear</button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 shrink-0">Category:</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${selectedCategory.includes(c) ? 'bg-slate-700 text-slate-100 border-slate-600' : 'text-slate-500 border-slate-800/50 hover:text-slate-300'}`}
              aria-pressed={selectedCategory.includes(c)}
            >
              {c}
            </button>
          ))}
          {selectedCategory.length > 0 && (
            <button onClick={() => setSelectedCategory([])} className="text-xs text-cyan-500 hover:text-cyan-400">Clear</button>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        <p className="text-xs text-slate-500">{filtered.length} alert{filtered.length !== 1 ? 's' : ''} matching filters</p>
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-xl p-4 space-y-3 transition-all ${
              alert.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-500/5' :
              alert.severity === 'HIGH' ? 'border-red-500/25 bg-red-500/3' :
              alert.severity === 'MEDIUM' ? 'border-amber-500/25' :
              'border-slate-800/50'
            } ${alert.status !== 'ACTIVE' ? 'opacity-60' : ''}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertIcon severity={alert.severity} />
                <SeverityBadge severity={alert.severity} />
                <Badge variant="default" size="sm">{alert.category}</Badge>
                <Badge variant={alert.status === 'ACTIVE' ? 'danger' : alert.status === 'ACKNOWLEDGED' ? 'warning' : 'success'} size="sm" dot>
                  {alert.status}
                </Badge>
              </div>
              <span className="text-xs text-slate-600 font-mono shrink-0">
                {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm')}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-slate-100">{alert.title}</h3>

            {/* Details */}
            <p className="text-xs text-slate-400 leading-relaxed">{alert.description}</p>

            {/* Impact */}
            <div className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-slate-400 mb-1">Impact</p>
              <p className="text-xs text-slate-300">{alert.impact}</p>
            </div>

            {/* Suggested action */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-cyan-400 mb-1">Suggested Action</p>
              <p className="text-xs text-slate-300">{alert.suggestedAction}</p>
            </div>

            {/* Source + timestamps */}
            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
              <span>Source: {alert.source}</span>
              {alert.acknowledgedAt && <span>Acknowledged: {format(new Date(alert.acknowledgedAt), 'HH:mm')} by {alert.acknowledgedBy}</span>}
              {alert.resolvedAt && <span>Resolved: {format(new Date(alert.resolvedAt), 'HH:mm')}</span>}
            </div>

            {/* Actions */}
            {alert.status === 'ACTIVE' && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CheckCircle2 size={13} />}
                  onClick={() => acknowledgeAlert(alert.id, 'Station Operator')}
                >
                  Acknowledge
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Mark Resolved
                </Button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell size={36} className="text-slate-700 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-400">No alerts match your filters</p>
            <p className="text-xs text-slate-600 mt-1">Try adjusting the search or filters above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
