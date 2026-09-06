import React from 'react';
import { 
  Check, 
  AlertTriangle, 
  X, 
  Circle, 
  ArrowRight, 
  ShieldCheck, 
  Info,
  Layers
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusPill } from '../common/StatusPill';

interface ResultClassificationBadgesScreenProps {
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const ResultClassificationBadgesScreen: React.FC<ResultClassificationBadgesScreenProps> = ({
  onProceed,
  onNavigate
}) => {
  const badgeDefinitions = [
    {
      id: 'verified',
      name: 'Verified',
      pillStatus: 'VERIFIED',
      hex: '#0D9488 (Teal)',
      bgClass: 'bg-teal-50 border-teal-200 text-teal-800',
      icon: Check,
      meaning: 'Statutory compliance confirmed.',
      criteria: 'All 5 mandatory declarations (MRP, Net Quantity, Manufacturer, Consumer Care, Dates) exist, meet Schedule II minimum font sizes, and match registration.',
      action: 'Dossier marked compliant; certificate appended to central enforcement repository.'
    },
    {
      id: 'potential-violation',
      name: 'Potential Violation',
      pillStatus: 'POTENTIAL_VIOLATION',
      hex: '#DC2626 (Red)',
      bgClass: 'bg-rose-50 border-rose-300 text-rose-800',
      icon: X,
      meaning: 'Statutory non-compliance flagged.',
      criteria: 'Missing mandatory declaration, illegible consumer care, dual-pricing sticker affixed, or font height below Legal Metrology Rule 12 threshold.',
      action: 'Inspector reviews evidence, confirms legal notice issuance, or dismisses if lawful exemption applies.'
    },
    {
      id: 'inconsistent',
      name: 'Inconsistent',
      pillStatus: 'INCONSISTENT',
      hex: '#D97706 (Amber)',
      bgClass: 'bg-amber-50 border-amber-300 text-amber-900',
      icon: AlertTriangle,
      meaning: 'Cross-source divergence detected.',
      criteria: 'Physical packaging declarations conflict with GS1 master registry (e.g. printed ₹349 vs registered ₹299, or net weight difference).',
      action: 'Requires physical carton verification and retailer invoice audit.'
    },
    {
      id: 'insufficient-evidence',
      name: 'Insufficient Evidence',
      pillStatus: 'INSUFFICIENT_EVIDENCE',
      hex: '#64748B (Slate)',
      bgClass: 'bg-slate-100 border-slate-300 text-slate-700',
      icon: Circle,
      meaning: 'Evidentiary threshold not met.',
      criteria: 'Excessive glare on price box, motion blur (>40%), missing back panel photo, or damaged/torn paper packaging.',
      action: 'System prompts inspector to capture additional angles or activate continuous video rotation.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Result Classification System
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Taxonomy Reference
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Standardized evidentiary taxonomy ensuring unambiguous legal outcomes across all 19 inspection views.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Proceed to Inspector Review →
        </GlassButton>
      </div>

      {/* 4 Classification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {badgeDefinitions.map((badge) => {
          return (
            <GlassCard
              key={badge.id}
              hoverEffect
              className="p-6 border border-white/90 space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <StatusPill status={badge.pillStatus} size="lg" />
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {badge.hex}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{badge.name}</h3>
                <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                  {badge.meaning}
                </p>
              </div>

              <div className="space-y-2 text-xs pt-1 border-t border-slate-200/70">
                <div>
                  <span className="font-bold text-slate-700">Trigger Conditions:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{badge.criteria}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700">Required Officer Action:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{badge.action}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Guidance Note */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-3">
        <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Human-in-the-Loop Governance Standard</p>
          <p className="text-slate-600 mt-0.5">
            InspectMate does not emit automated penalties. All four classifications feed into the <strong>Inspector Review</strong> cockpit, where the authorized regulatory officer renders the binding administrative decision.
          </p>
        </div>
      </div>
    </div>
  );
};
