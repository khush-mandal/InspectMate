import React from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  FileText,
  Award,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';

interface AnalyticsScreenProps {
  onNavigate: (screen: number) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onNavigate }) => {
  const topViolations = [
    { label: 'Dual Pricing / Price Sticker Overprint (Rule 6(1)(e))', percent: 42, count: 32, color: 'bg-rose-500' },
    { label: 'Font Height Non-Compliance (Schedule II Table)', percent: 28, count: 21, color: 'bg-amber-500' },
    { label: 'Incomplete Consumer Care / Grievance Redressal', percent: 18, count: 14, color: 'bg-indigo-500' },
    { label: 'Illegible / Missing MFD or Expiry Stamping', percent: 12, count: 9, color: 'bg-teal-500' },
  ];

  const categoryCompliance = [
    { category: 'Packaged Food & Groceries', total: 180, compliant: 135, rate: '75%' },
    { category: 'Cosmetics & Personal Care', total: 94, compliant: 78, rate: '83%' },
    { category: 'Household Chemicals & Cleaners', total: 68, compliant: 54, rate: '79%' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Regulatory Analytics & Enforcement Telemetry
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              State-Wide Dashboard
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Aggregated intelligence across field inspections under Legal Metrology Act, 2009.
          </p>
        </div>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          icon={<FileText size={15} />}
        >
          Download State Enforcement Report
        </GlassButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 sm:p-5 border border-white/90">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Inspected (Q1)
          </span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">342</p>
          <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold mt-2">
            <TrendingUp size={13} />
            <span>+18% surge in surveillance</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 border border-white/90">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overall Compliance Rate
          </span>
          <p className="text-3xl font-extrabold text-teal-800 mt-1">78.4%</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            268 of 342 packages fully compliant
          </p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 border border-white/90">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Legal Notices Issued
          </span>
          <p className="text-3xl font-extrabold text-rose-700 mt-1">74</p>
          <p className="text-xs text-rose-800 mt-2 font-medium">
            Form VIII dispatched to packers
          </p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 border border-white/90">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Inspection Time
          </span>
          <p className="text-3xl font-extrabold text-indigo-900 mt-1">2.4 min</p>
          <p className="text-xs text-indigo-700 mt-2 font-medium">
            Down from 18 min manual auditing
          </p>
        </GlassCard>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top Infringements Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard className="p-6 border border-white/90 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Top Regulatory Infringements Breakdown
                </h3>
                <p className="text-xs text-slate-500">Frequency of non-compliance across 74 issued notices</p>
              </div>
              <span className="text-xs font-bold text-slate-400 font-mono">N=74</span>
            </div>

            <div className="space-y-4">
              {topViolations.map((v, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 truncate max-w-[280px] sm:max-w-md">{v.label}</span>
                    <span className="font-mono text-slate-900 shrink-0">{v.percent}% ({v.count} cases)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${v.color}`}
                      style={{ width: `${v.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-500 shrink-0" />
              <span>
                Dual pricing remains the highest infraction category, particularly among retail supermarket chains.
              </span>
            </div>
          </GlassCard>

          {/* Commodity Category Compliance Table */}
          <GlassCard className="p-6 border border-white/90">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Compliance Rate by Commodity Category
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="pb-2">Commodity Class</th>
                    <th className="pb-2">Inspections</th>
                    <th className="pb-2">Compliant</th>
                    <th className="pb-2 text-right">Compliance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryCompliance.map((cat, idx) => (
                    <tr key={idx} className="py-2.5">
                      <td className="py-2.5 font-semibold text-slate-800">{cat.category}</td>
                      <td className="py-2.5 font-mono text-slate-600">{cat.total}</td>
                      <td className="py-2.5 font-mono text-teal-700">{cat.compliant}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">{cat.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Enforcement Timeline & Officer Performance */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-6 border border-white/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award size={16} className="text-indigo-600" />
                Field Officer Performance
              </h3>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                Delhi West Circle
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Officer Ashish Sainik</p>
                  <p className="text-[11px] text-slate-500">Badge INS-DEL-742</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-indigo-900 text-sm">84 Audits</p>
                  <p className="text-[10px] text-teal-700 font-semibold">98.2% Accuracy</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Officer Neha Sharma</p>
                  <p className="text-[11px] text-slate-500">Badge INS-DEL-619</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-indigo-900 text-sm">76 Audits</p>
                  <p className="text-[10px] text-teal-700 font-semibold">97.5% Accuracy</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Officer Rajesh Verma</p>
                  <p className="text-[11px] text-slate-500">Badge INS-DEL-503</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-indigo-900 text-sm">62 Audits</p>
                  <p className="text-[10px] text-teal-700 font-semibold">96.8% Accuracy</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Action Navigation */}
          <GlassCard className="p-5 border border-white/90 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Enforcement Utilities
            </h4>

            <button
              onClick={() => onNavigate(19)}
              className="w-full p-3 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-left transition flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-amber-950">Edge-Case & Failure Sandbox</p>
                <p className="text-[10px] text-amber-800">Test torn labels, extreme glare, and offline mode</p>
              </div>
              <ArrowUpRight size={16} className="text-amber-700 group-hover:translate-x-0.5 transition" />
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
