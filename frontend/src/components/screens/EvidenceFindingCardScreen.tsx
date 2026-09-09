import React from 'react';
import { 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  FileText, 
  AlertTriangle, 
  Scale,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { StatusPill } from '../common/StatusPill';
import { ProductSample } from '../../types';

interface EvidenceFindingCardScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const EvidenceFindingCardScreen: React.FC<EvidenceFindingCardScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Evidence-Backed Finding Dossier
            </h1>
            <StatusPill status="NEEDS_REVIEW" size="md" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Standardized evidentiary card linking optical glyph detections to statutory rule references.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          View Classification System →
        </GlassButton>
      </div>

      {/* Main Glass Finding Card */}
      <GlassCard className="p-6 sm:p-8 border border-white/95 shadow-xl space-y-6 relative overflow-hidden">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header with Status & Confidence */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                Finding ID: FND-2026-8821
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                Needs Inspector Review
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">
              Dual Pricing / Secondary Sticker Anomaly
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Commodity: <strong className="text-slate-800">{product.name}</strong> • GTIN {product.gtin}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <ConfidenceRing
              score={94}
              size={68}
              strokeWidth={6}
              label="94% CONF."
            />
          </div>
        </div>

        {/* Evidence Grid: Photo Crop + Metric Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: High-Res Crop with Bounding Box Overlay */}
          <div className="md:col-span-6 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Physical Evidence Crop (Macro View)
            </span>

            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-900 border border-slate-200 shadow-md">
              <img
                src={product.imageUrlBack}
                alt="Evidence Crop"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Bounding Box Highlight */}
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px]" />
              <div className="absolute top-[35%] left-[25%] w-[50%] h-[35%] border-2 border-amber-400 bg-amber-400/20 rounded-xl shadow-lg shadow-amber-500/30 flex flex-col justify-between p-2">
                <span className="text-[10px] font-bold text-white bg-amber-600 px-1.5 py-0.5 rounded self-start font-mono">
                  MRP Tag: ₹349.00
                </span>
                <span className="text-[9px] text-white/90 bg-slate-900/80 px-1.5 py-0.5 rounded self-end font-mono">
                  Bounding Box #04
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Sensor: 4K Native Optical Macro</span>
              <span className="font-mono text-[11px]">Geo: 28.5355° N, 77.3910° E</span>
            </div>
          </div>

          {/* Right: Statutory Requirements & Detected Values */}
          <div className="md:col-span-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Statutory Rule ID & Version
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Scale size={14} className="text-indigo-600" />
                  <span>PCR-2011-R6(1)(e) — Font Height & Dual Pricing Prohibition</span>
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detected Physical Value
                </span>
                <p className="text-sm font-bold text-rose-700 font-mono mt-0.5">
                  ₹349.00 (Inclusive of all taxes)
                </p>
                <p className="text-[11px] text-slate-500">Secondary sticker affixed over original package print.</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Registered Central Master Value
                </span>
                <p className="text-sm font-bold text-teal-700 font-mono mt-0.5">
                  ₹299.00 (National GS1 Registry)
                </p>
                <p className="text-[11px] text-slate-500">Filed by manufacturer on 15-Jan-2026.</p>
              </div>
            </div>

            {/* Microcopy Tone Adherence Reminder */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Evidentiary Notice:</strong> Flagged as <em>"Potential Violation — Needs Inspector Review"</em>. AI algorithm highlights the variance; legal adjudication requires authorized officer sign-off.
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => onNavigate(8)}
            icon={<Eye size={14} />}
          >
            Inspect Full Evidence Image
          </GlassButton>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <GlassButton
              variant="primary"
              size="md"
              onClick={() => onNavigate(15)}
              icon={<ArrowRight size={15} />}
              className="w-full sm:w-auto"
            >
              Adjudicate Finding in Inspector Review →
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
