import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Video, 
  ArrowRight,
  Camera,
  Loader2
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { ProductSample } from '../../types';

interface QualityMetricItem {
  id: string;
  label: string;
  description: string;
  score: number;
  passed: boolean;
}

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
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<QualityMetricItem[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isAcceptable, setIsAcceptable] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  // Real Gemini API Call on Mount / Image Load
  useEffect(() => {
    analyzeImageQuality();
  }, [product.imageUrlBack]);

  const analyzeImageQuality = async () => {
    setLoading(true);
    try {
      // Image URL ko base64/blob format me bhejte hain API endpoint par
      const res = await fetch('/api/inspections/analyze-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: product.imageUrlBack
        }),
      });

      const data = await res.json();
      if (data.success && data.metrics) {
        const m = data.metrics;
        
        // Dynamic list from Gemini Response
        const formattedMetrics: QualityMetricItem[] = [
          {
            id: 'sharpness',
            label: 'Image Sharpness & Focus',
            description: 'Checks blur and edge detection clarity',
            score: m.sharpness,
            passed: m.sharpness >= 70
          },
          {
            id: 'glare',
            label: 'Specular Glare Suppression',
            description: 'Verifies text isn’t washed out by light reflect',
            score: 100 - m.glare, // Lower glare is better
            passed: m.glare <= 30
          },
          {
            id: 'resolution',
            label: 'Bounding Box Resolution',
            description: 'Ensures minimum pixel density for OCR',
            score: m.resolution,
            passed: m.resolution >= 75
          },
          {
            id: 'textVisibility',
            label: 'Text Contrast & Visibility',
            description: 'Checks font legibility against background',
            score: m.textVisibility,
            passed: m.textVisibility >= 70
          }
        ];

        setMetrics(formattedMetrics);
        setIsAcceptable(m.isAcceptable);
        setFeedback(m.feedback);

        // Overall Score Calculation
        const avg = Math.round((m.sharpness + (100 - m.glare) + m.resolution + m.textVisibility) / 4);
        setOverallScore(avg);
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Image Quality & Optical Pre-Check
            </h1>
            {!loading && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isAcceptable ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {isAcceptable ? 'Quality Verified (PASS)' : 'Image Not Suitable (FAIL)'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Automated image verification powered by Gemini AI.
          </p>
        </div>

        {/* Re-analyze Button */}
        <button
          onClick={analyzeImageQuality}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/80 border border-slate-200 shadow-xs hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Re-Analyze
        </button>
      </div>

      {/* Main Analysis Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Image Preview */}
        <div className="md:col-span-5 space-y-4">
          <GlassCard className="p-4 border border-white/90">
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-900 shadow-inner">
              <img
                src={product.imageUrlBack}
                alt="Captured Label"
                className={`w-full h-full object-cover transition-all ${
                  !isAcceptable && !loading ? 'blur-[1px] contrast-75' : 'filter-none'
                }`}
              />

              {loading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2">
                  <Loader2 className="animate-spin text-teal-400" size={24} />
                  <span>Gemini AI Analyzing Quality...</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* AI Guidance Box */}
          {!loading && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              isAcceptable
                ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}>
              <p className="font-bold flex items-center gap-1.5 mb-1">
                {isAcceptable ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {isAcceptable ? 'Optimal Optical Fidelity' : 'Quality Issues Detected'}
              </p>
              <p>{feedback || (isAcceptable ? 'Image satisfies criteria for OCR.' : 'Please retake image with better lighting.')}</p>
            </div>
          )}
        </div>

        {/* Right Column: Score & Detailed Checklist */}
        <div className="md:col-span-7 space-y-5">
          <GlassCard className="p-6 border border-white/90">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-5 border-b border-slate-200/80">
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  AI Optical Suitability Score
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {isAcceptable ? 'Ready for Legal Metrology OCR' : 'Pre-Processing Failed Quality Gate'}
                </h3>
              </div>

              <div className="shrink-0">
                <ConfidenceRing
                  score={overallScore}
                  size={76}
                  strokeWidth={7}
                  label={isAcceptable ? 'PASS' : 'FAIL'}
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
                      ? 'bg-white/60 border-slate-200/80'
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
                      <p className="text-xs font-bold text-slate-900">{metric.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{metric.description}</p>
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {!isAcceptable ? (
              <>
                <GlassButton variant="destructive" size="md" onClick={onRetake} icon={<RefreshCw size={15} />} className="w-full sm:w-auto">
                  Retake Photo Angle
                </GlassButton>
                <GlassButton variant="primary" size="md" onClick={onVideoFallback} icon={<Video size={15} />} className="w-full sm:w-auto">
                  Launch Video Fallback →
                </GlassButton>
              </>
            ) : (
              <>
                <GlassButton variant="secondary" size="md" onClick={onRetake} icon={<Camera size={15} />} className="w-full sm:w-auto">
                  Add Another Photo
                </GlassButton>
                <GlassButton variant="primary" size="lg" onClick={onProceed} icon={<ArrowRight size={16} />} className="w-full sm:w-auto">
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