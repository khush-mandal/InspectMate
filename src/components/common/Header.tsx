import React, { useState } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  User, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Layers, 
  ChevronDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  role?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onLogout?: () => void;
  onOpenScreenSelector?: () => void;
  currentScreenName?: string;
  currentScreen?: number;
  onNavigate?: (screen: number) => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  role = 'inspector',
  onRoleChange,
  onLogout,
  onOpenScreenSelector,
  currentScreenName = 'Dashboard',
  currentScreen = 2,
  onNavigate,
  isOnline = true
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-teal-500 shadow-md shadow-indigo-500/20 text-white shrink-0 p-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="11" cy="11" r="3" />
              <path d="m16 16 2.5 2.5" />
              <path d="m10 11 1.5 1.5 3-3" stroke="#2DD4BF" strokeWidth="2" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent font-serif">
                InspectMate
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                PWA v2.4
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium hidden sm:block">
              Evidence you can trust. <span className="text-slate-400 font-normal">| AI assists, inspector decides</span>
            </p>
          </div>
        </div>

        {/* Center: Interactive Screen Navigator Trigger */}
        <button
          onClick={() => {
            if (onOpenScreenSelector) {
              onOpenScreenSelector();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 border border-slate-200/90 text-xs font-semibold text-slate-800 shadow-xs transition cursor-pointer"
        >
          <Layers size={14} className="text-indigo-600" />
          <span className="text-slate-500">Screen:</span>
          <span className="text-indigo-950 font-bold max-w-[160px] truncate">{currentScreenName}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono">19 Screens</span>
        </button>

        {/* Right: Role Switcher, PWA, Alerts, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online status indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 text-emerald-800 border border-emerald-200/80 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Central Sync Active</span>
          </div>

          <PWAInstallButton />

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs transition"
            >
              <ShieldCheck size={14} className={role === 'inspector' ? 'text-indigo-600' : 'text-teal-600'} />
              <span className="hidden sm:inline">
                {role === 'inspector' ? 'Inspector Mode' : 'Regulator Admin'}
              </span>
              <span className="sm:hidden">
                {role === 'inspector' ? 'Insp' : 'Admin'}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card border border-white/90 p-2 shadow-xl z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Operating Mode</p>
                </div>
                <button
                  onClick={() => { 
                    if (onRoleChange) onRoleChange('inspector'); 
                    setShowRoleMenu(false); 
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    role === 'inspector' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p>Authorized Inspector</p>
                    <p className="text-[10px] text-slate-500 font-normal">Mobile field capture & audit flow</p>
                  </div>
                  {role === 'inspector' && <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />}
                </button>
                <button
                  onClick={() => { 
                    if (onRoleChange) onRoleChange('regulator'); 
                    setShowRoleMenu(false); 
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition mt-1 ${
                    role === 'regulator' ? 'bg-teal-50 text-teal-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p>Regulator / Controller</p>
                    <p className="text-[10px] text-slate-500 font-normal">Executive analytics & statutory enforcement</p>
                  </div>
                  {role === 'regulator' && <CheckCircle2 size={14} className="text-teal-600 shrink-0" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-white/70 hover:bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
              title="Regulatory Alerts"
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-card border border-white/90 p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Enforcement Alerts</span>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">2 Unresolved</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/60 text-xs">
                    <p className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-600" /> Dual-Pricing Alert
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5">NutriNosh Almond Butter has 28 reported price deviations in West Zone.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-amber-600" /> Rule Update Notice
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5">Legal Metrology Packaged Commodities (Amendment) 2026 font rules active.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Logout */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              AS
            </div>
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else if (onNavigate) {
                  onNavigate(1);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
