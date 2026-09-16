import React from 'react';

// ---- Card --------------------------------------------------

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
  noPad?: boolean;
}

export function Card({ children, className = '', onClick, elevated = false, noPad = false }: CardProps) {
  const baseClass = elevated
    ? 'bg-[#061a25] border border-[#0d2b3f] rounded-xl'
    : 'bg-[#041219] border border-[#0a2233] rounded-xl';

  return (
    <div
      className={`${baseClass} ${!noPad ? 'p-4' : ''} ${onClick ? 'cursor-pointer hover:border-slate-600/60 transition-colors' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}

// ---- Card Header -------------------------------------------

export function CardHeader({
  title,
  subtitle,
  actions,
  icon,
  className = '',
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 text-cyan-400" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0 ml-3">{actions}</div>}
    </div>
  );
}

// ---- Section -----------------------------------------------

export function Section({
  title,
  children,
  className = '',
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={className} aria-label={title}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
