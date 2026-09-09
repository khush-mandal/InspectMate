import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  Eye, 
  Edit3, 
  AlertTriangle,
  ZoomIn,
  Send,
  Save
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { StatusPill } from '../common/StatusPill';
import { INITIAL_EXTRACTED_FIELDS } from '../../data/mockData';
import { ExtractedField, ProductSample } from '../../types';

interface InspectorReviewScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const InspectorReviewScreen: React.FC<InspectorReviewScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [fields, setFields] = useState<ExtractedField[]>(INITIAL_EXTRACTED_FIELDS);
  const [decisionNotes, setDecisionNotes] = useState<string>(
    'Confirmed dual pricing sticker on back panel. Secondary label of ₹349.00 pasted over original manufacturer declaration of ₹199.00 without statutory justification.'
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string>('field-mrp');
  const [overrideState, setOverrideState] = useState<'ACCEPT' | 'REJECT' | 'UNCERTAIN'>('ACCEPT');

  const selectedField = fields.find(f => f.id === selectedFieldId) || fields[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Inspector Review & Adjudication
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Human-In-The-Loop Cockpit
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Authorized officer adjudication. AI assists; the inspector renders the sole binding legal determination.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Generate Final Report & Notice →
        </GlassButton>
      </div>

      {/* Main Cockpit Split: Visual Evidence vs Adjudication Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Zoomable / Pan Evidence Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-4 border border-white/90 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Eye size={15} className="text-indigo-600" />
                Evidence Ground Truth ({selectedField.sourceAngle})
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <ZoomIn size={13} />
                <span>Double-click to pan</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-900 shadow-md group">
              <img
                src={
                  selectedField.sourceAngle === 'Front'
                    ? product.imageUrlFront
                    : selectedField.sourceAngle === 'Side'
                    ? product.imageUrlNutrition
                    : product.imageUrlBack
                }
                alt="Inspection Evidence"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Bounding Box on Evidence */}
              <div
                className="absolute border-2 border-teal-400 bg-teal-400/20 rounded-md transition-all pointer-events-none"
                style={{
                  top: `${selectedField.boundingBox.y}%`,
                  left: `${selectedField.boundingBox.x}%`,
                  width: `${selectedField.boundingBox.width}%`,
                  height: `${selectedField.boundingBox.height}%`,
                }}
              />

              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] flex items-center justify-between">
                <span>{selectedField.label}</span>
                <span className="font-mono text-teal-300 font-bold">{selectedField.confidence}% OCR</span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <span className="font-bold text-slate-800">Rule under evaluation:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">{selectedField.ruleReference}</p>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Adjudication Decision Table & Override Controls */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard className="p-6 border border-white/90 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Statutory Field Determinations
            </h3>

            <div className="space-y-3">
              {fields.map((field) => {
                const isSelected = selectedFieldId === field.id;

                return (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`
                      p-3.5 rounded-2xl border transition-all cursor-pointer text-left
                      ${
                        isSelected
                          ? 'bg-white/95 border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white/60 hover:bg-white border-slate-200/80'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{field.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {field.sourceAngle}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {field.confidence}% Confidence
                      </span>
                    </div>

                    <p className="text-xs font-bold font-mono text-slate-900 mb-2">
                      {field.value}
                    </p>

                    {/* Field Override Controls */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] font-semibold text-slate-500">Officer Decision:</span>
                      
                      <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setOverrideState('ACCEPT')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition ${
                            overrideState === 'ACCEPT' && isSelected
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Accept AI Finding
                        </button>

                        <button
                          type="button"
                          onClick={() => setOverrideState('REJECT')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition ${
                            overrideState === 'REJECT' && isSelected
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Reject / Override
                        </button>

                        <button
                          type="button"
                          onClick={() => setOverrideState('UNCERTAIN')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition ${
                            overrideState === 'UNCERTAIN' && isSelected
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Mark Uncertain
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mandatory Officer Justification Note */}
            <div className="pt-3 border-t border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Mandatory Officer Adjudication Justification:</span>
                <span className="text-[10px] text-slate-400 font-normal">Recorded into legal court dossier</span>
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full glass-input p-3 rounded-xl text-xs font-medium text-slate-800 leading-relaxed"
                placeholder="State statutory rationale for accept/reject determination under Legal Metrology Act..."
              />
            </div>

            {/* Decision Confirmation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <GlassButton
                variant="secondary"
                size="md"
                onClick={() => onNavigate(12)}
              >
                ← Back to Checklist
              </GlassButton>

              <GlassButton
                variant="primary"
                size="md"
                onClick={onProceed}
                icon={<ArrowRight size={16} />}
              >
                Sign & Finalize Official Inspection Report →
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
