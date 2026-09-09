import React, { useState } from 'react';
import { 
  Camera, 
  Check, 
  RotateCw, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Maximize2, 
  Layers, 
  Image as ImageIcon,
  Sparkles,
  Zap
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ProductSample } from '../../types';

interface CaptureEvidenceScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const CaptureEvidenceScreen: React.FC<CaptureEvidenceScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [activeAngle, setActiveAngle] = useState<'Front' | 'Back' | 'Side' | 'Label'>('Front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [capturedCount, setCapturedCount] = useState(3);

  const angles = [
    {
      id: 'Front',
      label: '1. Front (PDP)',
      desc: 'Principal Display Panel (Name & Net Quantity)',
      status: 'CAPTURED',
      img: product.imageUrlFront
    },
    {
      id: 'Back',
      label: '2. Back Panel',
      desc: 'MRP box, Packer details & Consumer Care',
      status: 'CAPTURED',
      img: product.imageUrlBack
    },
    {
      id: 'Side',
      label: '3. Side / Date Stamp',
      desc: 'MFD, Expiry & Batch Lot Code',
      status: 'CAPTURED',
      img: product.imageUrlNutrition
    },
    {
      id: 'Label',
      label: '4. Barcode / Close-up',
      desc: 'Close-up of retail price sticker & GTIN',
      status: capturedCount >= 4 ? 'CAPTURED' : 'PENDING',
      img: product.imageUrlBarcode
    }
  ];

  const handleShutter = () => {
    setIsCapturing(true);
    setFlashActive(true);
    setTimeout(() => {
      setFlashActive(false);
      setIsCapturing(false);
      if (capturedCount < 4) setCapturedCount(4);
    }, 400);
  };

  const currentAngleObj = angles.find(a => a.id === activeAngle) || angles[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Capture Evidence
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {capturedCount} of 4 Angles Captured
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Guided capture for statutory declarations under Legal Metrology Packaged Commodities Rules.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Check Image Quality →
        </GlassButton>
      </div>

      {/* Main Viewfinder with Light Glass Overlay */}
      <div className="relative rounded-[26px] overflow-hidden glass-card border border-white/95 shadow-xl aspect-4/3 sm:aspect-16/10 bg-slate-900/90">
        {/* Background sample image representing active angle */}
        <img
          src={currentAngleObj.img}
          alt={activeAngle}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            flashActive ? 'opacity-30' : 'opacity-90'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Shutter flash animation overlay */}
        {flashActive && (
          <div className="absolute inset-0 bg-white/90 z-20 transition-opacity duration-200 pointer-events-none" />
        )}

        {/* Optical Sensor HUD & Alignment Guides */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between pointer-events-none">
          {/* Top HUD */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 text-white backdrop-blur-md text-xs font-semibold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Target: {activeAngle} Angle</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/90 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                4K HDR • 60 FPS
              </span>
            </div>
          </div>

          {/* Central Target Alignment Box */}
          <div className="relative mx-auto w-[75%] sm:w-[65%] h-[70%] border-2 border-dashed border-white/70 rounded-2xl flex items-center justify-center pointer-events-none">
            {/* Corner Bracket Ticks */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

            <div className="text-center px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/20 text-white max-w-xs">
              <p className="text-xs font-bold">{currentAngleObj.desc}</p>
              <p className="text-[10px] text-teal-300 font-medium mt-0.5">Align packaging within guidelines</p>
            </div>
          </div>

          {/* Bottom HUD with Shutter Trigger */}
          <div className="flex items-center justify-between pointer-events-auto">
            <button
              onClick={() => {
                const nextIdx = (angles.findIndex(a => a.id === activeAngle) + 1) % angles.length;
                setActiveAngle(angles[nextIdx].id as any);
              }}
              className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md border border-white/20 transition cursor-pointer"
              title="Rotate Angle"
            >
              <RotateCw size={18} />
            </button>

            {/* Shutter Button */}
            <button
              onClick={handleShutter}
              disabled={isCapturing}
              className="w-16 h-16 rounded-full bg-white p-1.5 shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer border-4 border-indigo-500/80"
              title="Capture Photo"
            >
              <div className="w-full h-full rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition">
                <Camera size={22} />
              </div>
            </button>

            <button
              onClick={() => onNavigate(7)}
              className="px-3 py-2 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Switch to Video</span>
              <RotateCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Guided Thumbnail Strip */}
      <GlassCard className="p-4 sm:p-5 border border-white/90">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Layers size={15} className="text-indigo-600" />
            Multi-Angle Evidence Dossier
          </h3>
          <span className="text-[11px] text-slate-500">
            Click an angle to preview or retake
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {angles.map((angle) => {
            const isSelected = activeAngle === angle.id;
            const isDone = angle.status === 'CAPTURED';

            return (
              <div
                key={angle.id}
                onClick={() => setActiveAngle(angle.id as any)}
                className={`
                  p-2.5 rounded-2xl border text-left cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-50 to-teal-50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/70 hover:bg-white border-slate-200/90'
                  }
                `}
              >
                <div className="relative rounded-xl overflow-hidden aspect-4/3 mb-2 bg-slate-100 border border-slate-200">
                  <img
                    src={angle.img}
                    alt={angle.label}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isDone ? (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500/90 text-white text-[9px] font-bold">
                      Pending
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-900 truncate">
                  {angle.label}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {angle.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Prompt to add another angle */}
        <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
            <Sparkles size={14} className="text-indigo-600" />
            <span>Need more proof? You can add batch stamp macros or seal close-ups.</span>
          </p>

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleShutter}
            icon={<Plus size={14} />}
          >
            Add Additional Angle / Macro
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
