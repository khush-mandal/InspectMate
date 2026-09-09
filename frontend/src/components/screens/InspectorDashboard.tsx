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
  TrendingUp,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusPill } from '../common/StatusPill';
import { InspectionRecord } from '../../types';
import { useInspectorDashboard } from '../../hooks/useInspectorDashboard';
import { useAuth } from '../../context/AuthContext';

// Extract a memoized component for optimal rendering
const InspectionRow = React.memo(({ 
  record, 
  onSelect, 
  onNav 
}: { 
  record: InspectionRecord; 
  onSelect: (record: InspectionRecord) => void;
  onNav: (screen: number) => void;
}) => {
  const handleRowClick = React.useCallback(() => {
    onSelect(record);
    onNav(15);
  }, [record, onSelect, onNav]);

  const displayId = record.id ? record.id.substring(0, 8) : 'Unknown';
  const displayDate = React.useMemo(() => 
    record.date ? new Date(record.date).toLocaleDateString() : 'Unknown date',
  [record.date]);

  return (
    <tr
      className="hover:bg-white/60 transition group cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="py-3.5 pl-2 font-mono font-bold text-indigo-700">
        {displayId}
      </td>
      <td className="py-3.5 font-semibold text-slate-900 max-w-[200px] truncate">
        {record.productName || record.category || 'Unknown Product'}
      </td>
      <td className="py-3.5 text-slate-600">
        {record.manufacturer || 'Manufacturer unavailable'}
      </td>
      <td className="py-3.5 text-slate-500">
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-slate-400" />
          {record.retailerName || 'Location unavailable'}
        </span>
      </td>
      <td className="py-3.5">
        <StatusPill status={record.status} size="sm" />
      </td>
      <td className="py-3.5 text-slate-600">
        {displayDate}
      </td>
      <td className="py-3.5 text-right pr-2">
        <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold text-xs group-hover:translate-x-0.5 transition">
          Inspect <ChevronRight size={14} />
        </span>
      </td>
    </tr>
  );
});
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
  const { user } = useAuth();
  const { data, isLoading, error, isOffline, lastUpdated, refresh } = useInspectorDashboard();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="p-4 rounded-full bg-rose-100 text-rose-600">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Unable to load dashboard data.</h2>
        <p className="text-slate-500">{error}</p>
        <GlassButton variant="primary" onClick={refresh}>TRY AGAIN</GlassButton>
      </div>
    );
  }

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
            Welcome back, <strong className="text-slate-800">{user?.name || 'Inspector'}</strong>. Ready for field regulatory verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <WifiOff size={14} />
              Offline Mode
            </div>
          )}
          <button 
            onClick={refresh} 
            disabled={isLoading || isOffline}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition disabled:opacity-50"
            title="Refresh Dashboard"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>

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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Inspections</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar size={18} />
            </div>
          </div>
          {isLoading ? (
            <div className="h-9 bg-slate-200 animate-pulse rounded w-16 mb-2"></div>
          ) : (
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{data?.summary.totalInspections || 0}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
            <span>All time</span>
          </div>
        </GlassCard>

        <GlassCard hoverEffect glowColor="amber" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Reviews</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock size={18} />
            </div>
          </div>
          {isLoading ? (
            <div className="h-9 bg-slate-200 animate-pulse rounded w-16 mb-2"></div>
          ) : (
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{data?.summary.pendingReview || 0}</p>
          )}
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
          {isLoading ? (
            <div className="h-9 bg-slate-200 animate-pulse rounded w-16 mb-2"></div>
          ) : (
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">{data?.summary.potentialViolations || 0}</p>
          )}
          <p className="text-xs font-medium text-rose-800 mt-2">
            Requires attention
          </p>
        </GlassCard>

        <GlassCard hoverEffect glowColor="teal" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          {isLoading ? (
            <div className="h-9 bg-slate-200 animate-pulse rounded w-16 mb-2"></div>
          ) : (
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-800 tracking-tight">{data?.summary.verified || 0}</p>
          )}
          <p className="text-xs font-medium text-teal-800 mt-2">
            Fully processed
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
      <GlassCard className="p-5 sm:p-6 border border-white/90 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Regulatory Inspections</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">Packaged commodities evaluated under Legal Metrology Act 2009</p>
              {lastUpdated && !isLoading && (
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {isOffline ? 'Cached' : 'Updated'}: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
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

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center bg-slate-50/50 p-4 rounded-xl">
                <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-32 animate-pulse hidden sm:block"></div>
                <div className="flex-1"></div>
                <div className="h-6 bg-slate-200 rounded-full w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : !data?.recentInspections || data.recentInspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No inspections yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Start your first inspection to begin building your inspection history.
            </p>
            <GlassButton variant="primary" onClick={onStartNewInspection} icon={<PlusCircle size={16} />}>
              + NEW INSPECTION
            </GlassButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Inspection ID</th>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Manufacturer</th>
                  <th className="pb-3">Retail Location</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentInspections.map((record) => (
                  <InspectionRow 
                    key={record.id} 
                    record={record} 
                    onSelect={onSelectInspection} 
                    onNav={onNavigate} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
