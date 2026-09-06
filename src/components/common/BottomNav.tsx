import React from 'react';
import { LayoutDashboard, PlusCircle, History, BarChart3, Layers } from 'lucide-react';
import { UserRole } from '../../types';

interface BottomNavProps {
  currentScreen: number;
  onNavigate: (screen: number) => void;
  role: UserRole;
  onOpenScreenSelector: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  role,
  onOpenScreenSelector
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/90 px-2 py-2 flex items-center justify-around shadow-2xl safe-area-inset-bottom">
      <button
        onClick={() => onNavigate(2)}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
          currentScreen === 2 ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard size={20} />
        <span className="text-[10px]">Dashboard</span>
      </button>

      <button
        onClick={() => onNavigate(3)}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
          currentScreen === 3 ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <div className="relative">
          <PlusCircle size={22} className={currentScreen === 3 ? 'text-indigo-600' : 'text-teal-600'} />
        </div>
        <span className="text-[10px]">Inspect</span>
      </button>

      <button
        onClick={() => onNavigate(17)}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
          currentScreen === 17 ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <History size={20} />
        <span className="text-[10px]">History</span>
      </button>

      <button
        onClick={() => onNavigate(18)}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
          currentScreen === 18 ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <BarChart3 size={20} />
        <span className="text-[10px]">Analytics</span>
      </button>

      <button
        onClick={onOpenScreenSelector}
        className="flex flex-col items-center gap-1 p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 transition"
      >
        <Layers size={20} />
        <span className="text-[10px]">Screens</span>
      </button>
    </nav>
  );
};
