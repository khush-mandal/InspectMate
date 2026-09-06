import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  FileCheck2, 
  BarChart3, 
  Compass, 
  AlertOctagon,
  Shield,
  Layers
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  currentScreen: number;
  onNavigate: (screenNumber: number) => void;
  role: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  role
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Inspector Dashboard',
      screen: 2,
      icon: LayoutDashboard,
      roles: ['inspector', 'regulator']
    },
    {
      id: 'new-inspection',
      label: 'New Inspection',
      screen: 3,
      icon: PlusCircle,
      badge: 'Draft',
      roles: ['inspector']
    },
    {
      id: 'inspection-flow',
      label: 'Interactive Journey',
      screen: 4,
      icon: Compass,
      subtitle: 'Screens 4-15',
      roles: ['inspector', 'regulator']
    },
    {
      id: 'history',
      label: 'Inspection History',
      screen: 17,
      icon: History,
      roles: ['inspector', 'regulator']
    },
    {
      id: 'final-report',
      label: 'Inspection Report',
      screen: 16,
      icon: FileCheck2,
      roles: ['inspector', 'regulator']
    },
    {
      id: 'analytics',
      label: 'Regulatory Analytics',
      screen: 18,
      icon: BarChart3,
      badge: 'Regulator',
      roles: ['regulator', 'inspector']
    },
    {
      id: 'edge-cases',
      label: 'Error & Edge States',
      screen: 19,
      icon: AlertOctagon,
      badge: 'Diagnostics',
      roles: ['inspector', 'regulator']
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-white/80 p-4 shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
      <div className="space-y-1">
        <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Inspection Portal
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = 
            item.screen === currentScreen ||
            (item.id === 'inspection-flow' && currentScreen >= 4 && currentScreen <= 15);

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.screen)}
              className={`
                w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold
                transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/70'
                }
              `}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Core Principle Callout */}
      <div className="mt-auto pt-4 border-t border-slate-200/80">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-teal-50/90 border border-indigo-100 text-slate-700 shadow-xs">
          <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs mb-1">
            <Shield size={14} className="text-teal-600" />
            <span>Guiding Mandate</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            "AI assists, inspector decides." Never frame outputs as autonomous legal truth.
          </p>
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            PCR 2011 • Sec 6(1) Enforced
          </div>
        </div>
      </div>
    </aside>
  );
};
