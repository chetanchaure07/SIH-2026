import { useState, useEffect } from 'react';
import { Bell, User, ChevronDown, Wifi, WifiOff, Moon, Sun, Play, Square } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '@/stores/appStore';
import { useAlertStore } from '@/stores/alertStore';
import { stationData } from '@/mock/stationData';
import { DemoBadge, Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui';

export function Header() {
  const { dataMode, setDataMode, theme, setTheme } = useAppStore();
  const criticalAlerts = useAlertStore((s) => s.getCriticalCount());
  const activeAlerts = useAlertStore((s) => s.getActiveCount());
  const [now, setNow] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-12 bg-[#020a0f] border-b border-slate-800/60 flex items-center justify-between px-4 shrink-0 z-40">
      {/* Left — Station name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200 hidden sm:block">{stationData.name}</span>
          <span className="text-[10px] text-slate-600 hidden lg:block">— {stationData.location}</span>
        </div>
        <DemoBadge />
      </div>

      {/* Center — Time */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-600 hidden md:block">UTC</span>
          <span className="font-mono text-slate-300 font-medium tabular-nums">
            {format(now, 'HH:mm:ss')}
          </span>
          <span className="text-slate-600 hidden lg:block">{format(now, 'dd MMM yyyy')}</span>
        </div>

        {/* Demo mode indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
          <span className="text-amber-500 font-medium">Demo Mode</span>
        </div>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-1.5">
        {/* Demo/Live mode toggle */}
        <Tooltip content={dataMode === 'DEMO' ? 'Switch to Live mode (requires backend)' : 'Switch to Demo mode'} position="bottom">
          <button
            onClick={() => setDataMode(dataMode === 'DEMO' ? 'LIVE' : 'DEMO')}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all duration-150 cursor-pointer
              bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
            aria-label={`Mode: ${dataMode}`}
          >
            {dataMode === 'DEMO' ? <Play size={12} className="text-amber-400" /> : <Wifi size={12} className="text-emerald-400" />}
            <span className="hidden sm:block">{dataMode === 'DEMO' ? 'DEMO' : 'LIVE'}</span>
          </button>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} position="bottom">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-150"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </Tooltip>

        {/* Alerts */}
        <Tooltip content={`${activeAlerts} active alert${activeAlerts !== 1 ? 's' : ''}`} position="bottom">
          <button
            className="relative p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-150"
            aria-label={`Alerts: ${activeAlerts} active`}
          >
            <Bell size={15} />
            {activeAlerts > 0 && (
              <span
                className={`absolute top-1 right-1 min-w-[14px] h-3.5 flex items-center justify-center text-[9px] font-bold rounded-full px-1 ${criticalAlerts > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}
                aria-hidden="true"
              >
                {activeAlerts}
              </span>
            )}
          </button>
        </Tooltip>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-150"
            aria-label="User menu"
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
          >
            <div className="w-6 h-6 bg-cyan-500/15 border border-cyan-500/30 rounded-full flex items-center justify-center" aria-hidden="true">
              <User size={13} className="text-cyan-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 hidden sm:block">Operator</span>
            <ChevronDown size={12} aria-hidden="true" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-[#041219] border border-slate-700/60 rounded-xl shadow-xl z-50 py-1"
              role="menu"
              aria-label="User menu"
            >
              <div className="px-3 py-2 border-b border-slate-800/60">
                <p className="text-xs font-semibold text-slate-200">Station Operator</p>
                <p className="text-[11px] text-slate-500">operator@prs-alpha.int</p>
              </div>
              <button role="menuitem" className="w-full text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-3 py-2 transition-colors">
                Profile & Settings
              </button>
              <button role="menuitem" className="w-full text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-3 py-2 transition-colors">
                Help & Documentation
              </button>
              <div className="border-t border-slate-800/60 mt-1 pt-1">
                <button role="menuitem" className="w-full text-left text-xs text-red-400 hover:bg-red-500/10 px-3 py-2 transition-colors">
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
