// Re-export Badge and Button so pages can import from '@/components/ui'
export { Badge, StatusBadge, SeverityBadge, HealthBadge, DemoBadge, LiveBadge } from '@/components/ui/Badge';
export { Button } from '@/components/ui/Button';
export { Card, CardHeader, Section } from '@/components/ui/Card';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import type { AlertSeverity } from '@/types';

interface StatusIndicatorProps {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig = {
  ONLINE: { color: 'bg-emerald-400', label: 'Online', text: 'text-emerald-400', animate: false },
  DEGRADED: { color: 'bg-amber-400', label: 'Degraded', text: 'text-amber-400', animate: true },
  OFFLINE: { color: 'bg-red-500', label: 'Offline', text: 'text-red-400', animate: false },
  UNKNOWN: { color: 'bg-slate-600', label: 'Unknown', text: 'text-slate-500', animate: false },
};

export function StatusIndicator({ status, label, size = 'md' }: StatusIndicatorProps) {
  const cfg = statusConfig[status];
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label={`Status: ${label ?? cfg.label}`}>
      <span
        className={`${dotSize} rounded-full ${cfg.color} ${cfg.animate ? 'animate-pulse' : ''} shrink-0`}
        aria-hidden="true"
      />
      <span className={`${textSize} font-medium ${cfg.text}`}>{label ?? cfg.label}</span>
    </div>
  );
}

// ---- Alert Icon --------------------------------------------

export function AlertIcon({ severity, size = 16 }: { severity: AlertSeverity; size?: number }) {
  const props = { size, 'aria-hidden': true as const };
  switch (severity) {
    case 'CRITICAL': return <AlertTriangle {...props} className="text-red-400 shrink-0" />;
    case 'HIGH': return <AlertCircle {...props} className="text-red-400 shrink-0" />;
    case 'MEDIUM': return <AlertTriangle {...props} className="text-amber-400 shrink-0" />;
    case 'LOW': return <AlertCircle {...props} className="text-blue-400 shrink-0" />;
    case 'INFO': return <Info {...props} className="text-slate-400 shrink-0" />;
  }
}

// ---- Progress Bar ------------------------------------------

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'cyan' | 'green' | 'amber' | 'red' | 'blue' | 'purple';
  size?: 'xs' | 'sm' | 'md';
  animated?: boolean;
}

const progressColors: Record<string, string> = {
  cyan: 'bg-cyan-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  purple: 'bg-violet-500',
};

const progressSizes: Record<string, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = 'cyan',
  size = 'sm',
  animated = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const displayColor = pct < 20 ? 'red' : pct < 40 ? 'amber' : color;

  return (
    <div className="flex flex-col gap-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && <span className="text-xs font-mono text-slate-300">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-slate-800/60 rounded-full overflow-hidden ${progressSizes[size]}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`${progressSizes[size]} ${progressColors[displayColor]} rounded-full transition-all duration-500 ${animated ? 'animate-pulse-slow' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---- Divider -----------------------------------------------

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-slate-800/60 ${className}`} />;
}

// ---- Empty State -------------------------------------------

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-slate-700 mb-4" aria-hidden="true">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ---- Loading Skeleton --------------------------------------

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-slate-800/50 rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function KPISkeleton() {
  return (
    <div className="bg-[#041219] border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ---- Error State -------------------------------------------

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export function ErrorState({ title = 'Data unavailable', message, action }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <X size={32} className="text-slate-700 mb-3" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-slate-400 mb-1">{title}</h3>
      {message && <p className="text-xs text-slate-600 max-w-sm leading-relaxed mb-3">{message}</p>}
      {action}
    </div>
  );
}

// ---- Check mark --------------------------------------------

export function CheckBadge({ checked }: { checked: boolean }) {
  return checked
    ? <CheckCircle2 size={14} className="text-emerald-400" aria-label="Active" />
    : <X size={14} className="text-slate-600" aria-label="Inactive" />;
}

// ---- Tooltip wrapper (CSS-based) ---------------------------

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[position];

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        role="tooltip"
        className={`absolute ${posClass} z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
      >
        <div className="bg-slate-900 text-slate-200 text-xs px-2 py-1.5 rounded-md border border-slate-700/60 whitespace-nowrap shadow-lg max-w-xs">
          {content}
        </div>
      </div>
    </div>
  );
}

// ---- Tabs --------------------------------------------------

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-1 bg-slate-900/50 border border-slate-800/50 rounded-lg p-1 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150
            ${tab.id === active
              ? 'bg-slate-800 text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }
          `}
        >
          {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ---- Select ------------------------------------------------

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}

export function Select({ value, onChange, options, label, className = '' }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-slate-400">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ---- Data Row (key-value pair) ----------------------------

export function DataRow({ label, value, unit, mono = true }: { label: string; value: React.ReactNode; unit?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xs font-medium text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

// ---- Modal -------------------------------------------------

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={`relative bg-[#041219] border border-slate-700/60 rounded-xl w-full ${sizeClass} shadow-2xl`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-800/50"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
