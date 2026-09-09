import React, { useState } from 'react';
import { 
  Video, 
  RotateCw, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Play, 
  Eye, 
  Film,
  Zap,
  Clock
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ProductSample } from '../../types';

interface VideoFallbackScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const VideoFallbackScreen: React.FC<VideoFallbackScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<string>('mrp');

  const keyframes = [
    {
      id: 'mrp',
      field: 'MRP Declaration',
      value: '₹199.00 (Incl. of all taxes)',
      frameIndex: '#042',
      timestamp: '00:01.40',
      sharpnessScore: 95,
      confidence: 94,
      image: product.imageUrlBack,
      angle: '45° Cylindrical Rotation'
    },
    {
      id: 'net-qty',
      field: 'Net Quantity (PDP)',
      value: '500 g',
      frameIndex: '#018',
      timestamp: '00:00.60',
      sharpnessScore: 98,
      confidence: 96,
      image: product.imageUrlFront,
      angle: '0° Direct Front Face'
    },
    {
      id: 'manufacturer',
      field: 'Packer / Legal Identity',
      value: 'ABC Foods Pvt Ltd, New Delhi',
      frameIndex: '#078',
      timestamp: '00:02.60',
      sharpnessScore: 92,
      confidence: 91,
      image: product.imageUrlBack,
      angle: '120° Side-Back Curve'
    },
    {
      id: 'dates',
      field: 'MFD / Expiry Stamp',
      value: 'MFD: 12/2025 | EXP: 06/2026',
      frameIndex: '#112',
      timestamp: '00:03.73',
      sharpnessScore: 89,
      confidence: 89,
      image: product.imageUrlNutrition,
      angle: '210° Neck / Shoulder Stamp'
    }
  ];

  const handleSimulateAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1200);
  };

  const activeKeyframe = keyframes.find(k => k.id === selectedFrame) || keyframes[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Continuous Video Rotation Fallback
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Cylindrical / Curved Ingestion
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Overcomes label curvature & localized glare by extracting optimal sharpness keyframes across a 360° sweep.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Use Extracted Frames →
        </GlassButton>
      </div>

      {/* Main Video Capture & Frame Deconstruction Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Video Canvas / Playback */}
        <div className="md:col-span-6 space-y-4">
          <GlassCard className="p-4 border border-white/90">
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-950 shadow-inner">
              <img
                src={activeKeyframe.image}
                alt={activeKeyframe.field}
                className="w-full h-full object-cover opacity-90"
                referrerPolicy="no-referrer"
              />

              {/* Dynamic Video Progress Ticks */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/20">
                <Film size={13} className="text-teal-400" />
                <span>Frame {activeKeyframe.frameIndex}</span>
                <span className="text-slate-400">({activeKeyframe.timestamp})</span>
              </div>

              {/* Angle Tag */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-indigo-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-indigo-400/30">
                {activeKeyframe.angle}
              </div>

              {/* Rotation sweep indicator */}
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <RotateCw size={15} className="text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>360° Cylindrical Sweep: 142 frames analyzed</span>
                </div>
                <button
                  onClick={handleSimulateAnalysis}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider transition"
                >
                  {isAnalyzing ? 'Processing...' : 'Re-Scan Video'}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} /> Total Duration: 00:04.20
              </span>
              <span className="text-teal-700 font-semibold">
                Laplacian Peak Detection: Active
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Right: Results Grid of Best Extracted Keyframes per Field */}
        <div className="md:col-span-6 space-y-4">
          <GlassCard className="p-5 border border-white/90">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-teal-600" />
                  Best Extracted Keyframes per Field
                </h3>
                <p className="text-xs text-slate-500">Auto-selected by maximum glyph contrast & zero specularity</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {keyframes.map((kf) => {
                const isSelected = selectedFrame === kf.id;

                return (
                  <div
                    key={kf.id}
                    onClick={() => setSelectedFrame(kf.id)}
                    className={`
                      p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3
                      ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-50/95 to-teal-50/95 border-indigo-400 shadow-md ring-2 ring-indigo-500/15'
                          : 'bg-white/70 hover:bg-white border-slate-200/80'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={kf.image}
                          alt={kf.field}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{kf.field}</p>
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-700">
                            {kf.frameIndex}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-indigo-900 mt-0.5 truncate max-w-[200px]">
                          {kf.value}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {kf.confidence}%
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sharpness {kf.sharpnessScore}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <span>
              All 4 statutory zones reconstructed with &gt;90% average clarity. Frames forwarded to the Legal Metrology OCR engine.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
