import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Scale,
  Sparkles,
  Info,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ProductSample } from '../../types';
import { useEvidenceCapture } from '../../context/EvidenceCaptureContext';

interface ComplianceChecklistScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const ComplianceChecklistScreen: React.FC<ComplianceChecklistScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const { 
    extractedData, 
    complianceSummary, 
    isEvaluating, 
    reEvaluateCompliance 
  } = useEvidenceCapture();

  useEffect(() => {
    if (!complianceSummary && extractedData) {
      reEvaluateCompliance();
    }
  }, [complianceSummary, extractedData, reEvaluateCompliance]);

  const finalStatus = complianceSummary?.finalStatus || 'VERIFIED';
  const statusDescription = complianceSummary?.statusDescription || 'Statutory review ready.';

  const getStatusBadge = () => {
    switch (finalStatus) {
      case 'VERIFIED':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800',
          badge: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="text-emerald-600" size={20} />,
          title: 'VERIFIED',
          desc: 'Evidence and statutory declarations are fully consistent and compliant.'
        };
      case 'POTENTIAL VIOLATION':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-900',
          badge: 'bg-rose-600 text-white',
          icon: <XCircle className="text-rose-600" size={20} />,
          title: 'POTENTIAL VIOLATION',
          desc: 'Strong indication of non-compliance identified. Requires inspector verification.'
        };
      case 'INCONSISTENT':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-900',
          badge: 'bg-amber-600 text-white',
          icon: <AlertTriangle className="text-amber-600" size={20} />,
          title: 'INCONSISTENT',
          desc: 'Different evidence sources or package declarations disagree.'
        };
      case 'INSUFFICIENT EVIDENCE':
      default:
        return {
          bg: 'bg-slate-500/15 border-slate-500/30 text-slate-800',
          badge: 'bg-slate-600 text-white',
          icon: <HelpCircle className="text-slate-600" size={20} />,
          title: 'INSUFFICIENT EVIDENCE',
          desc: 'The package could not be reliably inspected due to blur, glare, or occlusion.'
        };
    }
  };

  const statusMeta = getStatusBadge();
  const ruleResults = complianceSummary?.ruleResults || [];

  const passedCount = ruleResults.filter(r => r.passed).length;
  const failedCount = ruleResults.filter(r => !r.passed).length;

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
            Verification matrix against mandatory packaged commodity declarations under statutory rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="md"
            onClick={() => reEvaluateCompliance()}
            icon={<RotateCcw size={15} className={isEvaluating ? 'animate-spin' : ''} />}
            disabled={isEvaluating}
          >
            Re-evaluate
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            onClick={onProceed}
            icon={<ArrowRight size={16} />}
          >
            Adjudicate Finding →
          </GlassButton>
        </div>
      </div>

      {/* Authoritative 4-Tier Statutory Outcome Card */}
      <GlassCard className={`p-5 border rounded-2xl transition-all shadow-md ${statusMeta.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white shadow-sm shrink-0 mt-0.5">
              {statusMeta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full tracking-wider ${statusMeta.badge}`}>
                  {statusMeta.title}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {complianceSummary?.category || 'COMMODITY'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {statusDescription}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {statusMeta.desc}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-black/10">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs bg-white/70 px-2.5 py-1 rounded-lg">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>{passedCount} Passed</span>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs bg-white/70 px-2.5 py-1 rounded-lg">
                <XCircle size={14} className="text-rose-600" />
                <span>{failedCount} Infringements</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Dynamic Rule Results Checklist Items */}
      <div className="space-y-3.5">
        {ruleResults.length === 0 ? (
          <GlassCard className="p-8 text-center text-slate-500">
            <Scale size={32} className="mx-auto mb-2 text-indigo-400" />
            <p className="font-semibold text-slate-800">No active rule evaluations available</p>
            <p className="text-xs mt-1">Capture package evidence or run AI extraction to populate statutory findings.</p>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => reEvaluateCompliance()}
              className="mt-4"
              icon={<RotateCcw size={14} />}
            >
              Run Statutory Audit
            </GlassButton>
          </GlassCard>
        ) : (
          ruleResults.map((item) => {
            const isPassed = item.passed;
            return (
              <GlassCard
                key={item.ruleId}
                className="p-5 border border-white/90 hover:border-indigo-200 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/70">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{item.ruleName}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.ruleReference}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        item.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shadow-xs shrink-0 ${
                    isPassed 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}>
                    {isPassed ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-rose-600" />}
                    <span>{isPassed ? 'VERIFIED' : 'POTENTIAL VIOLATION'}</span>
                  </span>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      Confidence: {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};
