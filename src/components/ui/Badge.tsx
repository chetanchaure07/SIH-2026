import React from 'react';
import type { SystemStatus, AlertSeverity, AssetHealth } from '@/types';

// ---- Badge -------------------------------------------------

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const badgeVariants: Record<string, string> = {
  default: 'bg-slate-700/60 text-slate-300 border border-slate-600/50',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  muted: 'bg-slate-800/60 text-slate-500 border border-slate-700/50',
};

export function Badge({ children, variant = 'default', size = 'sm', dot, className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md ${sizeClass} ${badgeVariants[variant]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

// ---- Status Badge ------------------------------------------

export function StatusBadge({ status }: { status: SystemStatus }) {
  const map: Record<SystemStatus, { label: string; variant: BadgeProps['variant'] }> = {
    NORMAL: { label: 'Normal', variant: 'success' },
    WATCH: { label: 'Watch', variant: 'info' },
    WARNING: { label: 'Warning', variant: 'warning' },
    CRITICAL: { label: 'Critical', variant: 'danger' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

// ---- Alert Severity Badge ----------------------------------

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const map: Record<AlertSeverity, { label: string; variant: BadgeProps['variant'] }> = {
    INFO: { label: 'Info', variant: 'info' },
    LOW: { label: 'Low', variant: 'default' },
    MEDIUM: { label: 'Medium', variant: 'warning' },
    HIGH: { label: 'High', variant: 'danger' },
    CRITICAL: { label: 'Critical', variant: 'danger' },
  };
  const { label, variant } = map[severity];
  return (
    <Badge variant={variant} dot size="sm">
      {severity === 'CRITICAL' ? (
        <span className="font-bold">{label}</span>
      ) : label}
    </Badge>
  );
}

// ---- Health Badge ------------------------------------------

export function HealthBadge({ status }: { status: AssetHealth }) {
  const map: Record<AssetHealth, { label: string; variant: BadgeProps['variant'] }> = {
    HEALTHY: { label: 'Healthy', variant: 'success' },
    WATCH: { label: 'Watch', variant: 'info' },
    MAINTENANCE_REQUIRED: { label: 'Maintenance Required', variant: 'warning' },
    CRITICAL: { label: 'Critical', variant: 'danger' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

// ---- Demo Mode Badge ---------------------------------------

export function DemoBadge() {
  return (
    <Badge variant="warning" size="sm">
      DEMO
    </Badge>
  );
}

// ---- Data Mode Badge ---------------------------------------

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
      LIVE
    </span>
  );
}
