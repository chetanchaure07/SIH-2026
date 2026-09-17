import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Zap, TrendingUp, Battery, Fuel,
  Wind, Brain, FlaskConical, Bell, Wrench, CloudSnow,
  BarChart3, FileText, HeartPulse, Settings, ChevronLeft,
  ChevronRight, Gauge, Layers, Shield
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAlertStore } from '@/stores/alertStore';
import { Tooltip } from '@/components/ui';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const navItems: NavItem[] = [
  // Dashboard
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, group: 'MAIN' },

  // Energy
  { path: '/generation', label: 'Energy Generation', icon: <Zap size={18} />, group: 'ENERGY' },
  { path: '/renewables', label: 'Solar & Wind', icon: <Wind size={18} />, group: 'ENERGY' },
  { path: '/battery', label: 'Battery Storage', icon: <Battery size={18} />, group: 'ENERGY' },
  { path: '/loads', label: 'Power Consumption', icon: <Layers size={18} />, group: 'ENERGY' },

  // Backup
  { path: '/fuel', label: 'Backup Fuel', icon: <Fuel size={18} />, group: 'BACKUP' },
  { path: '/generators', label: 'Generators', icon: <Gauge size={18} />, group: 'BACKUP' },

  // Forecast & AI
  { path: '/forecast', label: 'Energy Forecast', icon: <TrendingUp size={18} />, group: 'AI' },
  { path: '/ai', label: 'AI Recommendations', icon: <Brain size={18} />, group: 'AI' },
  { path: '/scenarios', label: 'What-If Scenarios', icon: <FlaskConical size={18} />, group: 'AI' },

  // Monitoring
  { path: '/alerts', label: 'Alerts', icon: <Bell size={18} />, group: 'MONITORING' },
  { path: '/weather', label: 'Weather', icon: <CloudSnow size={18} />, group: 'MONITORING' },

  // Reports & System
  { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} />, group: 'REPORTS' },
  { path: '/reports', label: 'Reports', icon: <FileText size={18} />, group: 'REPORTS' },
  { path: '/maintenance', label: 'Maintenance', icon: <Wrench size={18} />, group: 'REPORTS' },
  { path: '/health', label: 'System Health', icon: <HeartPulse size={18} />, group: 'REPORTS' },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} />, group: 'REPORTS' },
];

const groupOrder = ['MAIN', 'ENERGY', 'BACKUP', 'AI', 'MONITORING', 'REPORTS'];
const groupLabels: Record<string, string> = {
  MAIN: 'Overview',
  ENERGY: 'Energy',
  BACKUP: 'Backup Power',
  AI: 'Forecast & AI',
  MONITORING: 'Monitoring',
  REPORTS: 'Reports & System',
};

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const location = useLocation();
  const activeAlerts = useAlertStore((s) => s.getActiveCount());
  const criticalAlerts = useAlertStore((s) => s.getCriticalCount());

  const groupedItems: Record<string, NavItem[]> = {};
  navItems.forEach((item) => {
    const group = item.group ?? 'OTHER';
    if (!groupedItems[group]) groupedItems[group] = [];
    groupedItems[group].push(item);
  });

  return (
    <aside
      className={`
        flex flex-col h-full bg-[#020a0f] border-r border-slate-800/60
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-14' : 'w-56'}
      `}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-slate-800/60 ${collapsed ? 'justify-center px-0 py-4' : 'gap-2 px-4 py-4'}`}>
        <div className="shrink-0 w-7 h-7 bg-cyan-500/15 border border-cyan-500/30 rounded-lg flex items-center justify-center" aria-hidden="true">
          <Shield size={15} className="text-cyan-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate leading-tight">PRS Alpha</p>
            <p className="text-[10px] text-slate-600 truncate">Energy Management</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2" aria-label="Navigation sections">
        {groupOrder.map((group) => {
          const items = groupedItems[group];
          if (!items?.length) return null;
          return (
            <div key={group} className="mb-3">
              {!collapsed && (
                <div className="px-2 pt-2 pb-1">
                  <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest">
                    {groupLabels[group]}
                  </span>
                </div>
              )}
              {collapsed && <div className="border-t border-slate-800/40 my-1 mx-0.5" aria-hidden="true" />}
              {items.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
                const isAlerts = item.path === '/alerts';
                const hasCritical = isAlerts && criticalAlerts > 0;

                const navContent = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      flex items-center rounded-lg transition-all duration-150 relative group
                      ${collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-2'}
                      ${isActive
                        ? 'bg-cyan-500/12 text-cyan-400 border border-cyan-500/25'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 border border-transparent'
                      }
                    `}
                  >
                    <span className="shrink-0 relative" aria-hidden="true">
                      {item.icon}
                      {hasCritical && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
                      )}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="text-xs font-medium truncate flex-1">{item.label}</span>
                        {isAlerts && activeAlerts > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${criticalAlerts > 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {activeAlerts}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );

                return collapsed ? (
                  <Tooltip key={item.path} content={item.label} position="right">
                    {navContent}
                  </Tooltip>
                ) : navContent;
              })}
            </div>
          );
        })}
      </nav>

      {/* Toggle button */}
      <div className="p-2 border-t border-slate-800/60">
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-800/40 transition-all duration-150"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
