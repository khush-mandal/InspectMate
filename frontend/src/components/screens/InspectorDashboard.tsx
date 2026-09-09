import React from 'react';
import { 
  PlusCircle, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ChevronRight, 
  ShieldAlert,
  Sparkles,
  Barcode,
  Calendar,
  Building2,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusPill } from '../common/StatusPill';
import { HISTORICAL_INSPECTIONS } from '../../data/mockData';
import { InspectionRecord } from '../../types';

interface InspectorDashboardProps {
  onStartNewInspection: () => void;
  onSelectInspection: (record: InspectionRecord) => void;
  onNavigate: (screen: number) => void;
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({
  onStartNewInspection,
  onSelectInspection,
  onNavigate
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Inspector Greeting & "+ New Inspection" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Inspector Dashboard
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Zone: Delhi-NCR
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, <strong className="text-slate-800">Officer Ashish Sainik</strong>. Ready for field regulatory verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            onClick={() => onNavigate(19)}
            variant="secondary"
            size="md"
            icon={<AlertTriangle size={15} className="text-amber-600" />}
          >
            Diagnostics
          </GlassButton>

          <GlassButton
            onClick={onStartNewInspection}
            variant="primary"
            size="md"
            icon={<PlusCircle size={16} />}
          >
            + New Inspection
          </GlassButton>
        </div>
      </div>

      {/* Core Principle Callout Pill */}
      <div className="p-3.5 rounded-2xl glass-card border border-teal-200/80 bg-teal-50/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </div>
          <span>
            <strong className="text-teal-950 font-bold">Standard Operating Protocol:</strong> AI assists extraction & flags potential anomalies. Final violation determination is strictly reserved for the authorized inspector.
          </span>
        </div>
        <span className="text-[11px] font-mono text-teal-800 bg-white/80 px-2 py-0.5 rounded-lg border border-teal-200 shrink-0 hidden md:inline">
          LMR 2011 Compliant
        </span>
      </div>

      {/* 4 Glass Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard hoverEffect glowColor="indigo" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Audits</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">14</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-700">
            <TrendingUp size={13} />
            <span>+3 from yesterday</span>
          </div>
        </GlassCard>

        <GlassCard hoverEffect glowColor="amber" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Reviews</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">5</p>
          <p className="text-xs font-medium text-amber-800 mt-2">
            Awaiting manual verification
          </p>
        </GlassCard>

        <GlassCard hoverEffect glowColor="rose" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Potential Violations</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">3</p>
          <p className="text-xs font-medium text-rose-800 mt-2">
            Dual pricing & font ratio flags
          </p>
        </GlassCard>

        <GlassCard hoverEffect glowColor="teal" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified Violations</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-800 tracking-tight">2</p>
          <p className="text-xs font-medium text-teal-800 mt-2">
            Notices issued to packers
          </p>
        </GlassCard>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate(4)}
          className="glass-card glass-card-hover p-4 rounded-2xl text-left border border-white/90 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Barcode size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identify by Barcode/QR</h3>
              <p className="text-xs text-slate-500">Scan GTIN or 2D DataMatrix code</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition" />
        </button>

        <button
          onClick={() => onNavigate(5)}
          className="glass-card glass-card-hover p-4 rounded-2xl text-left border border-white/90 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Multi-Angle Capture</h3>
              <p className="text-xs text-slate-500">Front, back, side & label evidence</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-600 transition" />
        </button>

        <button
          onClick={() => onNavigate(18)}
          className="glass-card glass-card-hover p-4 rounded-2xl text-left border border-white/90 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800 text-white shadow-md group-hover:scale-105 transition">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Regulatory Analytics</h3>
              <p className="text-xs text-slate-500">State-wide enforcement telemetry</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-800 transition" />
        </button>
      </div>

      {/* Recent Inspections Table / List */}
      <GlassCard className="p-5 sm:p-6 border border-white/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Regulatory Inspections</h2>
            <p className="text-xs text-slate-500">Packaged commodities evaluated under Legal Metrology Act 2009</p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => onNavigate(17)}
            >
              View All Inspections →
            </GlassButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pl-2">Inspection ID</th>
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Manufacturer</th>
                <th className="pb-3">Retail Location</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HISTORICAL_INSPECTIONS.slice(0, 5).map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-white/60 transition group cursor-pointer"
                  onClick={() => {
                    onSelectInspection(record);
                    onNavigate(15);
                  }}
                >
                  <td className="py-3.5 pl-2 font-mono font-bold text-indigo-700">
                    {record.id}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-900 max-w-[200px] truncate">
                    {record.productName}
                  </td>
                  <td className="py-3.5 text-slate-600">
                    {record.manufacturer}
                  </td>
                  <td className="py-3.5 text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {record.retailerName} ({record.city})
                    </span>
                  </td>
                  <td className="py-3.5">
                    <StatusPill status={record.classification} size="sm" />
                  </td>
                  <td className="py-3.5 font-semibold text-slate-700">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                      record.confidenceScore >= 90 ? 'bg-teal-50 text-teal-800' :
                      record.confidenceScore >= 70 ? 'bg-amber-50 text-amber-800' :
                      'bg-rose-50 text-rose-800'
                    }`}>
                      {record.confidenceScore}%
                    </span>
                  </td>
                  <td className="py-3.5 text-right pr-2">
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold text-xs group-hover:translate-x-0.5 transition">
                      Inspect <ChevronRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
