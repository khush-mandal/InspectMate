import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Scan, 
  Database, 
  Cpu,
  Layers,
  Eye,
  Loader2
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ProductSample } from '../../types';
import { RulesApiClient, VerificationResponse } from '../../services/verify/RulesApiClient';

interface CrossSourceVerificationScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const CrossSourceVerificationScreen: React.FC<CrossSourceVerificationScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // We are using printedMrp as the extracted value, in a real flow this comes from ExtractedField
  const printedPrice = product.printedMrp;
  const centralPrice = product.referenceMrp; // ₹199 or ₹299

  useEffect(() => {
    const runVerification = async () => {
      try {
        setLoading(true);
        // Call the real rules engine endpoint
        const result = await RulesApiClient.verify({
          mrp: product.printedMrp,
          netQuantity: product.printedNetQuantity,
          manufacturer: product.manufacturer,
          dateInfo: product.mfd,
          consumerCare: product.consumerCareEmail
        });
        
        // Wait a bit to show loading state intentionally for demo purposes
        setTimeout(() => {
          setVerificationResult(result);
          setLoading(false);
        }, 1200);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to Rules Engine');
        setLoading(false);
      }
    };

    runVerification();
  }, [product]);

  const isMismatch = verificationResult?.finalStatus === 'POTENTIAL_VIOLATION';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-700">Running Deterministic Rules Engine...</h2>
        <p className="text-sm text-slate-500">Cross-validating OCR and Vision data against GS1 Registry and Legal Metrology Rules.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle size={48} className="text-rose-600" />
        <h2 className="text-xl font-bold text-slate-700">Rules Engine Error</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <GlassButton variant="primary" onClick={() => window.location.reload()}>Retry</GlassButton>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Cross-Source Verification
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              !isMismatch
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'bg-amber-50 text-amber-900 border border-amber-300'
            }`}>
              {!isMismatch ? '✓ Consistent State' : '⚠ Data Inconsistency Flagged'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Automated alignment between physical container OCR and National GS1 Commodity Master Data.
          </p>
        </div>
      </div>

      {/* Visual Flow Diagram: Physical Label → OCR+CV → [Barcode/QR | Trusted Data] → Cross-Validation */}
      <GlassCard className="p-6 border border-white/90">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
          <Layers size={16} className="text-indigo-600" />
          Verification Pipeline Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1: Physical Label */}
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/90 text-center relative flex flex-col items-center justify-between group">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 mb-2">
              <Scan size={22} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Source 1</span>
            <h4 className="text-xs font-bold text-slate-900 mt-0.5">Physical Container</h4>
            <p className="text-[11px] text-slate-500 mt-1">Multi-angle optical sensor ground evidence</p>
          </div>

          {/* Step 2: OCR & CV */}
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/90 text-center relative flex flex-col items-center justify-between group">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 mb-2">
              <Cpu size={22} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Step 2</span>
            <h4 className="text-xs font-bold text-slate-900 mt-0.5">OCR + Vision CV</h4>
            <p className="text-[11px] text-slate-500 mt-1">Extracts MRP: <strong className="text-slate-800">{printedPrice}</strong></p>
          </div>

          {/* Step 3: Barcode / Central DB */}
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/90 text-center relative flex flex-col items-center justify-between group">
            <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 mb-2">
              <Database size={22} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Source 2</span>
            <h4 className="text-xs font-bold text-slate-900 mt-0.5">National Master DB</h4>
            <p className="text-[11px] text-slate-500 mt-1">GTIN Registered MRP: <strong className="text-slate-800">{centralPrice}</strong></p>
          </div>

          {/* Step 4: Cross-Validation Engine */}
          <div className={`p-4 rounded-2xl border text-center relative flex flex-col items-center justify-between transition-all ${
            !isMismatch
              ? 'bg-teal-50/80 border-teal-300 text-teal-950 shadow-sm'
              : 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-sm'
          }`}>
            <div className={`p-3 rounded-2xl ${
              !isMismatch ? 'bg-teal-600 text-white' : 'bg-amber-600 text-white'
            } mb-2 shadow-xs`}>
              <GitCompare size={22} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              !isMismatch ? 'text-teal-800' : 'text-amber-800'
            }`}>Validation Engine</span>
            <h4 className="text-xs font-bold mt-0.5">
              {!isMismatch ? '100% Consistent' : 'Data Inconsistency'}
            </h4>
            <p className="text-[11px] opacity-80 mt-1">
              {!isMismatch ? 'Zero statutory discrepancy' : 'Discrepancy detected'}
            </p>
          </div>
        </div>
      </GlassCard>
      
      {/* Dynamic Rule Results Table */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Rule Engine Evaluation Details</h3>
        <div className="space-y-2">
          {verificationResult?.ruleResults.map((r, i) => (
             <div key={i} className={`p-3 border rounded flex items-center justify-between ${r.passed ? 'bg-teal-50 border-teal-100' : 'bg-rose-50 border-rose-100'}`}>
               <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">{r.ruleId}</span>
                  <span className="text-sm font-bold text-slate-800">{r.ruleName}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{r.message}</p>
               </div>
               <div>
                  {r.passed ? <CheckCircle2 className="text-teal-600" size={20} /> : <AlertTriangle className="text-rose-600" size={20} />}
               </div>
             </div>
          ))}
          {verificationResult?.ruleResults.length === 0 && (
             <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded">No active rules evaluated. Check database.</div>
          )}
        </div>
      </GlassCard>

      {/* Comparison Detail & Alert State */}
      {!isMismatch ? (
        <GlassCard className="p-6 border border-teal-200/90 bg-teal-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-teal-950">
                  Data Consistency Confirmed (Teal Status)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Physical printed declarations (MRP: {printedPrice}, Net Content: {product.printedNetQuantity}) match National Central Registry declarations identically. No evidence of price tampering or dual-labeling.
                </p>
              </div>
            </div>

            <GlassButton
              variant="primary"
              size="md"
              onClick={() => onNavigate(12)}
              icon={<ArrowRight size={15} />}
            >
              Proceed to Checklist →
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 border border-amber-300 bg-amber-50/60 shadow-md">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-amber-950">
                    Data Inconsistency Detected — Potential Violation Alert
                  </h3>
                </div>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  The physical container details do not match the expected constraints. A secondary price sticker may have been pasted to inflate retail value, or a required field is missing.
                </p>
              </div>
            </div>

            {/* Side-by-side comparison table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physical Evidence OCR</span>
                <p className="text-base font-bold text-rose-700 font-mono mt-0.5">{printedPrice}</p>
                <p className="text-[11px] text-slate-500">Extracted from back label sticker bounding box</p>
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GS1 / Central Database</span>
                <p className="text-base font-bold text-teal-700 font-mono mt-0.5">{centralPrice}</p>
                <p className="text-[11px] text-slate-500">Official filed MRP by {product.referenceCompany}</p>
              </div>
            </div>

            {/* Action Buttons specifically requested in prompt: View Evidence / Inspector Review */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-amber-200/80">
              <GlassButton
                variant="secondary"
                size="md"
                onClick={() => onNavigate(8)}
                icon={<Eye size={15} className="text-indigo-600" />}
              >
                View Evidence on Image
              </GlassButton>

              <div className="flex items-center gap-2">
                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate(15)}
                  icon={<ArrowRight size={15} />}
                >
                  Inspector Review & Adjudication →
                </GlassButton>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex items-center justify-between pt-2">
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => onNavigate(10)}
        >
          ← Back to Barcode Data
        </GlassButton>

        <GlassButton
          variant="primary"
          size="md"
          onClick={() => onNavigate(12)}
          icon={<ArrowRight size={15} />}
        >
          Next: Statutory Compliance Checklist →
        </GlassButton>
      </div>
    </div>
  );
};
