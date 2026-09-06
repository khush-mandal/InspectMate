import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Edit3, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { INITIAL_EXTRACTED_FIELDS } from '../../data/mockData';
import { ExtractedField, ProductSample } from '../../types';

interface OcrVerificationScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const OcrVerificationScreen: React.FC<OcrVerificationScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [fields, setFields] = useState<ExtractedField[]>(INITIAL_EXTRACTED_FIELDS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleStartEdit = (field: ExtractedField) => {
    setEditingId(field.id);
    setEditValue(field.value);
  };

  const handleSaveEdit = (fieldId: string) => {
    setFields(prev => prev.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          value: editValue,
          status: 'VERIFIED',
          confidence: 100 // Inspector verified
        };
      }
      return f;
    }));
    setEditingId(null);
  };

  const handleToggleVerify = (fieldId: string) => {
    setFields(prev => prev.map(f => {
      if (f.id === fieldId) {
        const nextStatus = f.status === 'VERIFIED' ? 'NEEDS_VERIFICATION' : 'VERIFIED';
        return { ...f, status: nextStatus };
      }
      return f;
    }));
  };

  const verifiedCount = fields.filter(f => f.status === 'VERIFIED').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              OCR Verification & Vision Cross-Check
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {verifiedCount} of {fields.length} Fields Verified
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Dual-engine cross-validation: Primary OCR vs Second-pass Vision Engine to eliminate hallucination.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Check Barcode & Reference Data →
        </GlassButton>
      </div>

      {/* Principle Reminder Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-xs text-indigo-950">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck size={17} className="text-indigo-600 shrink-0" />
          <span>
            <strong>Inspector Decision Rule:</strong> If OCR and Vision disagree, the inspector's manual entry overrides all automated models.
          </span>
        </div>
        <span className="text-[10px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 hidden sm:inline">
          Dual Pass Active
        </span>
      </div>

      {/* Side-by-Side Comparison Table / Cards */}
      <div className="space-y-4">
        {fields.map((field) => {
          const isVerified = field.status === 'VERIFIED';
          const isEditing = editingId === field.id;

          return (
            <GlassCard
              key={field.id}
              className={`p-5 border transition-all ${
                isVerified
                  ? 'bg-white/70 border-slate-200/90'
                  : 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-slate-900">{field.label}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {field.ruleReference}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVerify(field.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isVerified
                        ? 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                        : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 size={13} className="text-teal-600" />
                        <span>Verified Extraction</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={13} className="text-amber-600" />
                        <span>Needs Verification</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartEdit(field)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                    title="Manual Inspector Correction"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>

              {/* Side-by-Side Values */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3">
                {/* Engine 1: OCR Readout */}
                <div className="md:col-span-5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Pass 1: Primary Optical Engine
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full glass-input px-2 py-1 rounded-lg text-xs font-bold text-slate-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(field.id)}
                        className="px-2 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold font-mono text-slate-900 break-words">
                      {field.value}
                    </p>
                  )}
                </div>

                {/* Match Status Icon */}
                <div className="md:col-span-2 flex items-center justify-center py-1">
                  <div className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold flex items-center gap-1 border border-teal-200">
                    <Check size={11} strokeWidth={3} />
                    <span>Match</span>
                  </div>
                </div>

                {/* Engine 2: Vision Model Cross-Check */}
                <div className="md:col-span-5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Pass 2: Vision Semantic Engine
                  </span>
                  <p className="text-xs font-bold font-mono text-slate-800 break-words">
                    {field.visionCrossCheck}
                  </p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="pt-2 flex items-center justify-end">
        <GlassButton
          variant="primary"
          size="lg"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Confirm Verifications & Proceed to Barcode Lookup →
        </GlassButton>
      </div>
    </div>
  );
};
