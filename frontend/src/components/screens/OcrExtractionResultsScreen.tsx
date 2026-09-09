import React, { useState } from 'react';
import { 
  Scan, 
  Eye, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Maximize2, 
  FileText,
  Sparkles,
  Layers
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { INITIAL_EXTRACTED_FIELDS } from '../../data/mockData';
import { ExtractedField, ProductSample } from '../../types';

interface OcrExtractionResultsScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const OcrExtractionResultsScreen: React.FC<OcrExtractionResultsScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('field-mrp');
  const [fields] = useState<ExtractedField[]>(INITIAL_EXTRACTED_FIELDS);

  const selectedField = fields.find(f => f.id === selectedFieldId) || fields[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              OCR/CV Extraction Results
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              5 Statutory Declarations Extracted
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Multimodal optical recognition with localized bounding box geometry on physical evidence.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Verify Extraction Accuracy →
        </GlassButton>
      </div>

      {/* Main Layout: Field Cards & Interactive Bounding Box Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Field Cards */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Extracted Legal Metrology Fields
            </span>
            <span className="text-xs text-indigo-700 font-medium">
              Click to pinpoint on photo
            </span>
          </div>

          {fields.map((field) => {
            const isSelected = selectedFieldId === field.id;

            return (
              <GlassCard
                key={field.id}
                hoverEffect
                onClick={() => setSelectedFieldId(field.id)}
                className={`
                  p-4 transition-all border cursor-pointer
                  ${
                    isSelected
                      ? 'bg-white/95 border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/60 hover:bg-white/80 border-slate-200/80'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {field.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {field.ruleReference}
                      </span>
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        {field.sourceAngle} Panel
                      </span>
                    </div>

                    <p className="text-sm font-bold text-indigo-950 font-mono break-words">
                      {field.value}
                    </p>

                    <p className="text-xs text-slate-500 leading-snug">
                      {field.complianceNote}
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFieldId(field.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        <Eye size={13} />
                        <span>{isSelected ? 'Viewing on image' : 'View bounding box on photo'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Confidence Ring for each field */}
                  <div className="shrink-0 pl-2">
                    <ConfidenceRing
                      score={field.confidence}
                      size={52}
                      strokeWidth={5}
                      label={field.confidence >= 90 ? 'HIGH' : 'MEDIUM'}
                    />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Right Column: Interactive Bounding Box Visualizer on Source Photo */}
        <div className="lg:col-span-6 space-y-4">
          <GlassCard className="p-4 border border-white/90 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
              <div className="flex items-center gap-2">
                <Scan size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">
                  Physical Evidence Ground Truth ({selectedField.sourceAngle} View)
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Box: {selectedField.boundingBox.width}% × {selectedField.boundingBox.height}%
              </span>
            </div>

            {/* Photo Canvas with Dynamic Bounding Box Overlay */}
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-900 shadow-inner group">
              <img
                src={
                  selectedField.sourceAngle === 'Front'
                    ? product.imageUrlFront
                    : selectedField.sourceAngle === 'Side'
                    ? product.imageUrlNutrition
                    : product.imageUrlBack
                }
                alt="Physical Evidence"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Darkened backdrop except active box */}
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px] pointer-events-none" />

              {/* Active Bounding Box Highlight with Glow */}
              <div
                className="absolute border-2 border-teal-400 bg-teal-400/20 rounded-lg shadow-lg shadow-teal-500/40 transition-all duration-300 pointer-events-none flex flex-col justify-between p-1"
                style={{
                  top: `${selectedField.boundingBox.y}%`,
                  left: `${selectedField.boundingBox.x}%`,
                  width: `${selectedField.boundingBox.width}%`,
                  height: `${selectedField.boundingBox.height}%`,
                }}
              >
                {/* Corner Markers */}
                <div className="w-2 h-2 rounded-xs bg-teal-300" />
                <div className="self-end px-1.5 py-0.5 rounded bg-teal-800/90 text-white font-mono text-[9px] font-bold">
                  {selectedField.confidence}% Conf.
                </div>
              </div>

              {/* Bounding Box Label Tag Floating Above */}
              <div
                className="absolute px-2 py-1 rounded-md bg-slate-900/90 text-white text-[11px] font-bold shadow-md border border-white/20 pointer-events-none transition-all duration-300"
                style={{
                  top: `calc(${Math.max(selectedField.boundingBox.y - 12, 2)}%)`,
                  left: `${selectedField.boundingBox.x}%`,
                }}
              >
                {selectedField.label}: {selectedField.value}
              </div>
            </div>

            {/* Sub-card explaining the optical verification */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>Selected Field: {selectedField.label}</span>
                <span className="text-teal-700">✓ Optical Geometry Aligned</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Extracted from {selectedField.sourceAngle} face at {selectedField.confidence}% optical certainty. Bounding coordinates will be permanently appended to the official regulatory evidence package.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
