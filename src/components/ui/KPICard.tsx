import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock } from 'lucide-react';
import type { SystemStatus } from '@/types';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: number; // percentage change — positive = up, negative = down
  trendLabel?: string;
  status?: SystemStatus;
  statusLabel?: string;
  forecast?: string;
  timestamp?: string;
  icon?: React.ReactNode;
  valueClassName?: string;
  onClick?: () => void;
  warning?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<SystemStatus, { border: string; glow: string; text: string }> = {
  NORMAL: { border: 'border-slate-800/60', glow: '', text: 'text-emerald-400' },
  WATCH: { border: 'border-blue-600/30', glow: 'shadow-blue-500/5', text: 'text-blue-400' },
  WARNING: { border: 'border-amber-500/30', glow: 'shadow-amber-500/8', text: 'text-amber-400' },
  CRITICAL: { border: 'border-red-500/40', glow: 'shadow-red-500/10', text: 'text-red-400' },
};

export function KPICard({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendLabel,
  status = 'NORMAL',
  statusLabel,
  forecast,
  timestamp,
  icon,
  valueClassName = '',
  onClick,
  warning,
  size = 'md',
}: KPICardProps) {
  const cfg = statusConfig[status];
  const valueSizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl';

  return (
    <div
      className={`
        bg-[#041219] border ${cfg.border} rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden
        transition-all duration-200 shadow-sm ${cfg.glow}
        ${onClick ? 'cursor-pointer hover:border-slate-600/60 hover:bg-[#061a25]' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      aria-label={`${title}: ${value}${unit ? ' ' + unit : ''}`}
    >
      {/* Critical indicator bar */}
      {status === 'CRITICAL' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500/60" aria-hidden="true" />
      )}
      {status === 'WARNING' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/50" aria-hidden="true" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider leading-none">
          {title}
        </span>
        {icon && (
          <span className="text-slate-600" aria-hidden="true">{icon}</span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`${valueSizeClass} font-bold text-data ${valueClassName} text-slate-50`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>
      )}

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          {trend > 0.5 ? (
            <TrendingUp size={12} className="text-rose-400" aria-hidden="true" />
          ) : trend < -0.5 ? (
            <TrendingDown size={12} className="text-emerald-400" aria-hidden="true" />
          ) : (
            <Minus size={12} className="text-slate-500" aria-hidden="true" />
          )}
          <span className={`text-xs font-medium ${trend > 0.5 ? 'text-rose-400' : trend < -0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          {trendLabel && <span className="text-xs text-slate-600">{trendLabel}</span>}
        </div>
      )}

      {/* Status */}
      {statusLabel && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
          {status === 'CRITICAL' && (
            <AlertTriangle size={12} aria-label="Critical status" className="shrink-0" />
          )}
          <span>{statusLabel}</span>
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div className="flex items-start gap-1.5 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-md px-2 py-1.5">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" aria-label="Warning" />
          <span>{warning}</span>
        </div>
      )}

      {/* Forecast */}
      {forecast && (
        <p className="text-xs text-slate-500 italic">↗ {forecast}</p>
      )}

      {/* Timestamp */}
      {timestamp && (
        <div className="flex items-center gap-1 text-xs text-slate-600 mt-auto pt-1 border-t border-slate-800/50">
          <Clock size={10} aria-hidden="true" />
          <span className="text-data">{timestamp}</span>
        </div>
      )}
    </div>
  );
}
