import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Video, 
  ArrowRight, 
  SlidersHorizontal,
  Eye,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { GOOD_QUALITY_METRICS, BAD_QUALITY_METRICS } from '../../data/mockData';
import { ProductSample } from '../../types';

interface ImageQualityCheckScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onRetake: () => void;
  onVideoFallback: () => void;
}

export const ImageQualityCheckScreen: React.FC<ImageQualityCheckScreenProps> = ({
  product,
  onProceed,
  onRetake,
  onVideoFallback
}) => {
  const [qualityMode, setQualityMode] = useState<'good' | 'bad'>('good');

  const isGood = qualityMode === 'good';
  const metrics = isGood ? GOOD_QUALITY_METRICS : BAD_QUALITY_METRICS;
  const overallScore = isGood ? 94 : 48;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Image Quality & Optical Pre-Check
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isGood ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {isGood ? 'Quality Verified (PASS)' : 'Image Not Suitable (FAIL)'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Automated image verification ensures legal evidentiary standards prior to OCR extraction.
          </p>
        </div>

        {/* State Simulator toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 pl-2 pr-1">Simulate:</span>
          <button
            onClick={() => setQualityMode('good')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isGood
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Good State (94%)
          </button>
          <button
            onClick={() => setQualityMode('bad')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              !isGood
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bad State (48%)
          </button>
        </div>
      </div>

      {/* Main Analysis Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Image Preview with Glare/Focus Visualizer */}
        <div className="md:col-span-5 space-y-4">
          <GlassCard className="p-4 border border-white/90">
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-900 shadow-inner">
              <img
                src={product.imageUrlBack}
                alt="Captured Label"
                className={`w-full h-full object-cover transition-all ${
                  !isGood ? 'blur-[1.5px] contrast-75 brightness-110' : 'filter-none'
                }`}
                referrerPolicy="no-referrer"
              />

              {!isGood && (
                <>
                  {/* Simulated Glare hotspot */}
                  <div className="absolute top-[40%] right-[30%] w-24 h-24 rounded-full bg-white/70 blur-xl pointer-events-none" />
                  <div className="absolute top-[38%] right-[28%] px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-md">
                    Specular Glare Detected
                  </div>
                </>
              )}

              {/* Status Banner overlay */}
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-between text-xs">
                <span className="font-mono text-[11px]">Back_Panel_02.raw</span>
                <span className="text-[10px] font-semibold text-slate-300">ISO 100 • f/1.8</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Evidentiary Hash:</span>
              <span className="font-mono text-[11px] text-slate-700">sha256:7f8a9...b4c2</span>
            </div>
          </GlassCard>

          {/* Quick Guidance Box */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
            isGood
              ? 'bg-teal-50/70 border-teal-200 text-teal-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}>
            <p className="font-bold flex items-center gap-1.5 mb-1">
              {isGood ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {isGood ? 'Optimal Optical Fidelity' : 'Evidentiary Degradation Detected'}
            </p>
            <p>
              {isGood
                ? 'All mandatory declaration zones satisfy minimum legal metrology resolution and contrast criteria.'
                : 'Specular glare on the MRP bounding box will impede legal defense. High probability of OCR misinterpretation.'}
            </p>
          </div>
        </div>

        {/* Right Column: Score & Detailed Checklist */}
        <div className="md:col-span-7 space-y-5">
          {/* Aggregate Confidence Card */}
          <GlassCard className="p-6 border border-white/90">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-5 border-b border-slate-200/80">
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Optical Suitability Score
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {isGood ? 'Ready for Legal Metrology OCR' : 'Pre-Processing Failed Quality Gate'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Threshold for automated extraction is ≥ 80%
                </p>
              </div>

              <div className="shrink-0">
                <ConfidenceRing
                  score={overallScore}
                  size={76}
                  strokeWidth={7}
                  label={isGood ? 'EXCELLENT' : 'UNSUITABLE'}
                />
              </div>
            </div>

            {/* Checklist Metrics */}
            <div className="space-y-3 mt-4">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    metric.passed
                      ? 'bg-white/60 border-slate-200/80 hover:bg-white'
                      : 'bg-rose-50/80 border-rose-200/90 text-rose-950'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {metric.passed ? (
                      <CheckCircle2 size={17} className="text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={17} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {metric.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {metric.description}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                    metric.passed
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {metric.score}%
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Action Buttons depending on Good / Bad state */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {!isGood ? (
              <>
                <GlassButton
                  variant="destructive"
                  size="md"
                  onClick={onRetake}
                  icon={<RefreshCw size={15} />}
                  className="w-full sm:w-auto"
                >
                  Retake Photo Angle
                </GlassButton>

                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={onVideoFallback}
                  icon={<Video size={15} />}
                  className="w-full sm:w-auto"
                >
                  Launch Video Fallback →
                </GlassButton>
              </>
            ) : (
              <>
                <GlassButton
                  variant="secondary"
                  size="md"
                  onClick={onRetake}
                  icon={<Camera size={15} />}
                  className="w-full sm:w-auto"
                >
                  Add Another Photo
                </GlassButton>

                <GlassButton
                  variant="primary"
                  size="lg"
                  onClick={onProceed}
                  icon={<ArrowRight size={16} />}
                  className="w-full sm:w-auto"
                >
                  Continue to OCR/CV Extraction →
                </GlassButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
