import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variants: Record<string, string> = {
  primary:
    'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500/50 shadow-sm',
  secondary:
    'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600/60',
  ghost:
    'bg-transparent hover:bg-slate-800/70 text-slate-300 hover:text-slate-100 border border-transparent hover:border-slate-700/50',
  danger:
    'bg-red-700/20 hover:bg-red-700/40 text-red-400 border border-red-600/40',
  outline:
    'bg-transparent hover:bg-slate-800/50 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400/70',
  success:
    'bg-emerald-700/20 hover:bg-emerald-700/40 text-emerald-400 border border-emerald-600/40',
};

const sizes: Record<string, string> = {
  xs: 'text-xs px-2 py-1 rounded-md gap-1',
  sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
  lg: 'text-sm px-5 py-2.5 rounded-lg gap-2',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
}
