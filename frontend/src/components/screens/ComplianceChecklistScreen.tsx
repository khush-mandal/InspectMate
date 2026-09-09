import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Scale,
  Sparkles,
  Info
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ProductSample } from '../../types';

interface ComplianceChecklistScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

interface ChecklistItem {
  id: string;
  declaration: string;
  ruleReference: string;
  status: 'PASS' | 'FAIL' | 'UNCERTAIN';
  detectedValue: string;
  requirement: string;
  notes: string;
}

export const ComplianceChecklistScreen: React.FC<ComplianceChecklistScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'c1',
      declaration: 'Maximum Retail Price (MRP)',
      ruleReference: 'PCR 2011 - Rule 6(1)(e)',
      status: product.hasViolation ? 'FAIL' : 'PASS',
      detectedValue: product.printedMrp,
      requirement: 'Must include phrase "inclusive of all taxes" and comply with font height table in Schedule II.',
      notes: product.hasViolation ? 'Potential dual pricing sticker identified.' : 'Mandatory currency symbol ₹ and tax declaration verified.'
    },
    {
      id: 'c2',
      declaration: 'Net Quantity',
      ruleReference: 'PCR 2011 - Rule 6(1)(c) & Rule 12',
      status: 'PASS',
      detectedValue: product.printedNetQuantity,
      requirement: 'Must be in standard SI units (g, kg, ml, L) positioned on the Principal Display Panel.',
      notes: 'Unit "g" in lower case, font height ≥ 3.0mm compliant with packaging volume.'
    },
    {
      id: 'c3',
      declaration: 'Name & Address of Manufacturer / Packer',
      ruleReference: 'PCR 2011 - Rule 6(1)(a)',
      status: 'PASS',
      detectedValue: product.manufacturer,
      requirement: 'Complete postal address including PIN code & state of incorporation.',
      notes: 'Postal address fully matched against Registrar of Companies records.'
    },
    {
      id: 'c4',
      declaration: 'Consumer Care Helpline & Email',
      ruleReference: 'PCR 2011 - Rule 6(1)(n)',
      status: 'PASS',
      detectedValue: `${product.consumerCarePhone} | ${product.consumerCareEmail}`,
      requirement: 'Name, address, telephone number and email of grievance redressal officer.',
      notes: 'Toll-free number and active corporate domain verified.'
    },
    {
      id: 'c5',
      declaration: 'Month & Year of Manufacture / Expiry',
      ruleReference: 'PCR 2011 - Rule 6(1)(d)',
      status: 'PASS',
      detectedValue: `MFD: ${product.mfd} | EXP: ${product.expiryDate}`,
      requirement: 'Clear calendar month and year or "Best Before" duration from manufacture date.',
      notes: 'Standard 2-digit month and 4-digit year format verified.'
    }
  ]);

  const toggleStatus = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const next: 'PASS' | 'FAIL' | 'UNCERTAIN' = 
          item.status === 'PASS' ? 'FAIL' :
          item.status === 'FAIL' ? 'UNCERTAIN' : 'PASS';
        return { ...item, status: next };
      }
      return item;
    }));
  };

  const passCount = items.filter(i => i.status === 'PASS').length;
  const failCount = items.filter(i => i.status === 'FAIL').length;
  const uncertainCount = items.filter(i => i.status === 'UNCERTAIN').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Statutory Compliance Checklist
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              LMR / PCR 2011 Mandate
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Verification matrix against 5 mandatory packaged commodity declarations under Indian Law.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          View Evidence-Backed Finding →
        </GlassButton>
      </div>

      {/* Summary Score Bar */}
      <GlassCard className="p-4 sm:p-5 border border-white/90">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-teal-700 font-bold text-sm">
              <CheckCircle2 size={18} />
              <span>{passCount} Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
              <XCircle size={18} />
              <span>{failCount} Potential Violations</span>
            </div>
            {uncertainCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-sm">
                <HelpCircle size={18} />
                <span>{uncertainCount} Needs Clarification</span>
              </div>
            )}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Click status pills below to manually adjust finding
          </span>
        </div>
      </GlassCard>

      {/* Checklist Items */}
      <div className="space-y-3.5">
        {items.map((item) => {
          let statusBadge = (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shadow-xs">
              <CheckCircle2 size={14} className="text-teal-600" />
              <span>PASS</span>
            </span>
          );

          if (item.status === 'FAIL') {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 shadow-xs">
                <XCircle size={14} className="text-rose-600" />
                <span>POTENTIAL VIOLATION</span>
              </span>
            );
          } else if (item.status === 'UNCERTAIN') {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-xs">
                <HelpCircle size={14} className="text-amber-600" />
                <span>UNCERTAIN</span>
              </span>
            );
          }

          return (
            <GlassCard
              key={item.id}
              className="p-5 border border-white/90 hover:border-indigo-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/70">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{item.declaration}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.ruleReference}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.requirement}</p>
                </div>

                {/* Clickable pill to toggle status */}
                <button
                  type="button"
                  onClick={() => toggleStatus(item.id)}
                  className="self-start sm:self-center cursor-pointer hover:scale-105 active:scale-95 transition"
                  title="Click to toggle inspector determination"
                >
                  {statusBadge}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Detected Value on Container
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">{item.detectedValue}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Legal Metrology Assessment
                  </span>
                  <p className="text-slate-700 mt-0.5">{item.notes}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
