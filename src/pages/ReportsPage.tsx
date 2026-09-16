import React from 'react';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const REPORTS = [
  { id: 'daily-energy', name: 'Daily Energy Report', description: 'Comprehensive 24-hour energy consumption, generation, and efficiency summary.', category: 'Energy', frequency: 'DAILY', lastGenerated: '2026-09-16T00:05:00Z', formats: ['PDF', 'CSV'] as const },
  { id: 'fuel-report', name: 'Fuel Consumption Report', description: 'Fuel usage trends, consumption rates, delivery history, and forecast.', category: 'Fuel', frequency: 'DAILY', lastGenerated: '2026-09-16T00:05:00Z', formats: ['PDF', 'CSV'] as const },
  { id: 'generator-report', name: 'Generator Operations Report', description: 'Generator runtime, efficiency, maintenance status, and schedule.', category: 'Generators', frequency: 'DAILY', lastGenerated: '2026-09-15T00:05:00Z', formats: ['PDF'] as const },
  { id: 'renewable-report', name: 'Renewable Energy Report', description: 'Solar and wind generation performance, capacity factors, and weather correlation.', category: 'Renewables', frequency: 'WEEKLY', lastGenerated: '2026-09-10T00:00:00Z', formats: ['PDF', 'CSV'] as const },
  { id: 'battery-report', name: 'Battery Storage Report', description: 'SOC history, charge/discharge cycles, degradation trend, and health.', category: 'Battery', frequency: 'WEEKLY', lastGenerated: '2026-09-10T00:00:00Z', formats: ['PDF'] as const },
  { id: 'weekly-ops', name: 'Weekly Operations Summary', description: 'Executive summary of all energy systems, incidents, and recommendations.', category: 'Operations', frequency: 'WEEKLY', lastGenerated: '2026-09-10T00:00:00Z', formats: ['PDF'] as const },
  { id: 'maintenance-report', name: 'Predictive Maintenance Report', description: 'Asset health trends, anomaly detections, and upcoming maintenance schedule.', category: 'Maintenance', frequency: 'WEEKLY', lastGenerated: '2026-09-10T00:00:00Z', formats: ['PDF', 'CSV'] as const },
  { id: 'ai-audit', name: 'AI Decision Audit Log', description: 'Record of all AI recommendations and operator actions for compliance review.', category: 'AI', frequency: 'ON_DEMAND', formats: ['PDF', 'CSV'] as const },
];

export default function ReportsPage() {
  return (
    <div className="p-5 space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Generate and export operational reports</p>
      </div>

      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-400">
        Report generation will be handled by the backend. Preview and export buttons are shown here as UI placeholders for future integration.
      </div>

      <div className="space-y-3">
        {REPORTS.map((report) => (
          <div key={report.id} className="bg-[#041219] border border-slate-800/60 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 bg-slate-800/60 rounded-lg flex items-center justify-center shrink-0" aria-hidden="true">
                <FileText size={16} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-sm font-semibold text-slate-100">{report.name}</h3>
                  <Badge variant="default" size="sm">{report.category}</Badge>
                  <Badge variant={report.frequency === 'DAILY' ? 'success' : report.frequency === 'WEEKLY' ? 'info' : 'muted'} size="sm">
                    {report.frequency}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{report.description}</p>
                {report.lastGenerated && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1.5">
                    <Calendar size={10} aria-hidden="true" />
                    <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" icon={<Eye size={13} />}>Preview</Button>
              {report.formats.includes('PDF') && (
                <Button variant="secondary" size="sm" icon={<Download size={13} />}>PDF</Button>
              )}
              {report.formats.includes('CSV') && (
                <Button variant="secondary" size="sm" icon={<Download size={13} />}>CSV</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
