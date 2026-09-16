import React, { useState } from 'react';
import { Brain, CheckCircle2, X, Info, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar, DataRow, Modal } from '@/components/ui';
import type { AIRecommendation } from '@/types';
import { format } from 'date-fns';
import { aiModelInfo } from '@/mock/aiData';

const priorityStyles: Record<string, string> = {
  HIGH: 'border-red-500/30 bg-red-500/5',
  MEDIUM: 'border-amber-500/25 bg-amber-500/5',
  LOW: 'border-slate-700/50',
};

const priorityBadge: Record<string, 'danger' | 'warning' | 'info'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
};

function RecommendationCard({ rec }: { rec: AIRecommendation }) {
  const { acceptRecommendation, rejectRecommendation } = useAIStore();
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isActive = rec.status === 'PENDING';
  const isAccepted = rec.status === 'ACCEPTED';
  const isRejected = rec.status === 'REJECTED';

  return (
    <>
      <div className={`border rounded-xl p-4 space-y-3 transition-all ${priorityStyles[rec.priority]} ${isActive ? '' : 'opacity-60'}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityBadge[rec.priority]} size="sm">{rec.priority} PRIORITY</Badge>
            <Badge variant="default" size="sm">{rec.category}</Badge>
            {rec.timeSensitivity === 'IMMEDIATE' && (
              <Badge variant="danger" size="sm">⚡ IMMEDIATE</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAccepted && <Badge variant="success" dot>Accepted</Badge>}
            {isRejected && <Badge variant="muted" dot>Rejected</Badge>}
            <span className="text-xs text-slate-600">
              {format(new Date(rec.generatedAt), 'HH:mm')}
            </span>
          </div>
        </div>

        {/* Title + Description */}
        <div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">{rec.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Model confidence</span>
            <span className={`font-mono font-semibold ${rec.confidence >= 85 ? 'text-emerald-400' : rec.confidence >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
              {rec.confidence}%
            </span>
          </div>
          <ProgressBar value={rec.confidence} color={rec.confidence >= 85 ? 'green' : rec.confidence >= 70 ? 'amber' : 'red'} size="xs" />
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
          aria-expanded={expanded}
          aria-controls={`rec-details-${rec.id}`}
        >
          <Info size={12} aria-hidden="true" />
          {expanded ? 'Hide' : 'Show'} explanation
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {expanded && (
          <div id={`rec-details-${rec.id}`} className="space-y-3 border-t border-slate-800/50 pt-3">
            {/* Reason */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">WHY</p>
              <p className="text-xs text-slate-300 leading-relaxed">{rec.reason}</p>
            </div>

            {/* Impact */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">EXPECTED IMPACT</p>
              <p className="text-xs text-slate-300 leading-relaxed">{rec.expectedImpact}</p>
            </div>

            {/* Factors */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">CONTRIBUTING FACTORS</p>
              <div className="space-y-1.5">
                {rec.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.direction === 'POSITIVE' ? 'bg-emerald-400' : f.direction === 'NEGATIVE' ? 'bg-red-400' : 'bg-slate-500'}`} aria-hidden="true" />
                      <span className="text-xs text-slate-400 truncate">{f.name}</span>
                    </div>
                    <span className={`text-xs font-mono shrink-0 ${f.direction === 'POSITIVE' ? 'text-emerald-400' : f.direction === 'NEGATIVE' ? 'text-red-400' : 'text-slate-500'}`}>
                      {f.contribution}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected systems */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">AFFECTED SYSTEMS</p>
              <div className="flex flex-wrap gap-1">
                {rec.affectedSystems.map((s) => <Badge key={s} size="sm" variant="default">{s}</Badge>)}
              </div>
            </div>

            <DataRow label="Expires" value={format(new Date(rec.expiresAt), 'HH:mm dd/MM')} />
            <DataRow label="Model" value={rec.modelVersion} mono={false} />
          </div>
        )}

        {/* Actions */}
        {isActive && (
          <div className="flex gap-2 pt-1">
            <Button
              variant="success"
              size="sm"
              icon={<CheckCircle2 size={13} />}
              onClick={() => acceptRecommendation(rec.id, 'Station Operator')}
            >
              {rec.actionAcceptLabel}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<X size={13} />}
              onClick={() => setShowModal(true)}
            >
              {rec.actionRejectLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Reject Recommendation">
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">{rec.title}</p>
          <div>
            <label className="text-xs text-slate-500 block mb-1" htmlFor={`reason-${rec.id}`}>
              Reason for rejection (optional)
            </label>
            <textarea
              id={`reason-${rec.id}`}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/50 text-slate-200 text-xs rounded-lg p-2.5 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              placeholder="Optional: explain why you are rejecting this recommendation..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={() => {
                rejectRecommendation(rec.id, 'Station Operator', rejectReason);
                setShowModal(false);
              }}
            >
              Confirm Rejection
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function AIPage() {
  const { recommendations, decisionLog } = useAIStore();
  const [tab, setTab] = useState<'active' | 'log'>('active');

  const pending = recommendations.filter((r) => r.status === 'PENDING');
  const resolved = recommendations.filter((r) => r.status !== 'PENDING');

  return (
    <div className="p-5 space-y-5 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">AI Recommendation Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-assisted decision support — always verify before acting</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('active')} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab === 'active' ? 'bg-slate-800 text-slate-100 border-slate-700' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
            Active ({pending.length})
          </button>
          <button onClick={() => setTab('log')} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab === 'log' ? 'bg-slate-800 text-slate-100 border-slate-700' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
            Decision Log ({decisionLog.length})
          </button>
        </div>
      </div>

      {/* Important disclaimer */}
      <div className="flex items-start gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
        <Info size={15} className="text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <span className="text-blue-400 font-semibold">Decision Support System: </span>
          These recommendations are generated by AI models using simulated demo data. They are intended to assist — not replace — human judgment. Always verify recommendations against current operational conditions before acting.
          <span className="text-slate-500 ml-2">Model: {aiModelInfo.name} v{aiModelInfo.version} | Confidence: {aiModelInfo.overallConfidence}%</span>
        </div>
      </div>

      {tab === 'active' ? (
        <div className="space-y-4">
          {/* Active recommendations */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pending Action ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Resolved</h2>
              <div className="space-y-3">
                {resolved.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)}
              </div>
            </div>
          )}

          {pending.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle2 size={40} className="text-emerald-500/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">All recommendations resolved</p>
              <p className="text-xs text-slate-600 mt-1">No pending AI recommendations at this time.</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div className="space-y-3">
            {decisionLog.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No decisions logged yet</p>
              </div>
            ) : (
              decisionLog.map((entry) => (
                <div key={entry.id} className="border border-slate-800/50 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={entry.operatorAction === 'ACCEPTED' ? 'success' : 'danger'} dot size="sm">
                      {entry.operatorAction}
                    </Badge>
                    <span className="text-xs text-slate-600 font-mono">{format(new Date(entry.timestamp), 'HH:mm dd/MM')}</span>
                  </div>
                  <p className="text-xs text-slate-300">{entry.recommendationTitle}</p>
                  <p className="text-[11px] text-slate-600">By: {entry.operatorName}</p>
                  {entry.reason && <p className="text-xs text-slate-500 italic">"{entry.reason}"</p>}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
