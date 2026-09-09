import React, { useState } from 'react';
import { 
  AlertTriangle, 
  WifiOff, 
  RotateCw, 
  Languages, 
  Sun, 
  Scissors, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { StatusPill } from '../common/StatusPill';

interface EdgeCaseSandboxScreenProps {
  onNavigate: (screen: number) => void;
}

export const EdgeCaseSandboxScreen: React.FC<EdgeCaseSandboxScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'torn' | 'glare' | 'curved' | 'offline' | 'multilingual'>('torn');

  const cases = {
    torn: {
      title: 'Torn / Partially Occluded Statutory Label',
      scenario: 'Paper packaging with torn bottom edge obscuring consumer care helpline and portion of manufacturer PIN code.',
      confidence: 42,
      status: 'INSUFFICIENT_EVIDENCE',
      systemBehavior: 'OCR isolates legible characters ("...34-2900") and detects missing bounding coordinates. Refuses to guess or hallucinate digits.',
      inspectorPrompt: 'System requests manual transcription or barcode cross-reference. Inspector enters physical evidence note.',
      recommendation: 'Check commercial transit invoice or perform National GS1 Central Database cross-reference.',
      badge: 'Optical Truncation'
    },
    glare: {
      title: 'Extreme Specular Glare on Metallic Foil Pouch',
      scenario: 'Reflective silver metallized pouch where direct shop fluorescent tube creates bright white washout across the MRP stamp.',
      confidence: 38,
      status: 'INSUFFICIENT_EVIDENCE',
      systemBehavior: 'Pre-processing luminosity histogram flags saturated pixel cluster (>95% pure white) inside declared MRP bounding zone.',
      inspectorPrompt: 'System automatically triggers Polarizing Angle Guide: prompts inspector to tilt device 25° away from light source or switch to Continuous Video Fallback.',
      recommendation: 'Use Video Mode (Screen 7) to extract glare-free keyframes during package tilt.',
      badge: 'Luminance Saturation'
    },
    curved: {
      title: 'High-Distortion Curved Cylindrical Can',
      scenario: 'Narrow 330ml beverage can or cylindrical cosmetic spray where text wraps 180° around the curvature.',
      confidence: 86,
      status: 'VERIFIED',
      systemBehavior: 'Cylindrical unwrapping algorithm estimates surface curvature radius and re-maps text glyphs to a planar 2D canvas before OCR analysis.',
      inspectorPrompt: 'Inspector guided through continuous 3-second rotation sweep. Keyframe sharpness filter merges best segments.',
      recommendation: 'Supported seamlessly via Multi-Angle Capture & Video Rotation Fallback.',
      badge: 'Geometric Unwrapping'
    },
    offline: {
      title: 'Remote Field / Underground Basement (Offline Mode)',
      scenario: 'Wholesale cold storage or underground market basement with zero cellular/Wi-Fi connectivity.',
      confidence: 91,
      status: 'VERIFIED',
      systemBehavior: 'PWA Service Worker caches on-device lightweight OCR model and stores encrypted inspection dossiers in IndexedDB. Queues records for auto-sync.',
      inspectorPrompt: 'Banner displayed: "Offline Field Mode Active — 3 Inspections Queued for Cryptographic Synchronization".',
      recommendation: 'Dossier signed locally with inspector cryptographic badge; syncs automatically when network returns.',
      badge: 'Local-First PWA'
    },
    multilingual: {
      title: 'Multilingual / Dual Script Compliance (English + Hindi)',
      scenario: 'Packaged commodity with mandatory declarations printed in both Devanagari (Hindi) and Latin (English) scripts.',
      confidence: 96,
      status: 'VERIFIED',
      systemBehavior: 'Multilingual OCR parses dual-script representations concurrently, verifying that Hindi and English declared MRP & Net Quantity are mathematically identical.',
      inspectorPrompt: 'Both language versions highlighted side-by-side. Discrepancies between languages are flagged as potential consumer deception.',
      recommendation: 'Full compliance with Official Languages Act & Legal Metrology Bilingual Rules.',
      badge: 'Dual Script Engine'
    }
  };

  const current = cases[activeTab];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Edge-Case & Degradation Sandbox
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
              Field Robustness Matrix
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Simulate challenging field scenarios to inspect system degradation, optical guardrails, and human overrides.
          </p>
        </div>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => onNavigate(2)}
        >
          ← Return to Dashboard
        </GlassButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('torn')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'torn'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200'
          }`}
        >
          <Scissors size={14} />
          <span>1. Torn / Occluded</span>
        </button>

        <button
          onClick={() => setActiveTab('glare')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'glare'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200'
          }`}
        >
          <Sun size={14} />
          <span>2. Extreme Glare</span>
        </button>

        <button
          onClick={() => setActiveTab('curved')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'curved'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200'
          }`}
        >
          <RotateCw size={14} />
          <span>3. Curved Distortion</span>
        </button>

        <button
          onClick={() => setActiveTab('offline')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'offline'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200'
          }`}
        >
          <WifiOff size={14} />
          <span>4. Offline Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('multilingual')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'multilingual'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200'
          }`}
        >
          <Languages size={14} />
          <span>5. Dual Script (Hindi)</span>
        </button>
      </div>

      {/* Main Sandbox Visualizer */}
      <GlassCard className="p-6 sm:p-8 border border-white/95 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              Scenario: {current.badge}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{current.title}</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {current.scenario}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <StatusPill status={current.status} size="md" />
            <ConfidenceRing
              score={current.confidence}
              size={64}
              strokeWidth={6}
              label={current.confidence >= 80 ? 'HIGH' : 'LOW'}
            />
          </div>
        </div>

        {/* Behavior & Safeguards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Autonomous AI Guardrail Behavior
            </span>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {current.systemBehavior}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
              Inspector Prompt & Human Hand-off
            </span>
            <p className="text-xs text-teal-950 leading-relaxed font-medium">
              {current.inspectorPrompt}
            </p>
          </div>
        </div>

        {/* Technical Mitigation Callout */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
          <Sparkles size={18} className="text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 space-y-1">
            <p className="font-bold">Engine Safeguard Protocol:</p>
            <p className="text-slate-600 leading-relaxed">
              {current.recommendation}
            </p>
          </div>
        </div>

        {/* Sandbox Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => onNavigate(6)}
          >
            Test in Image Quality Gate (Screen 6) →
          </GlassButton>

          <GlassButton
            variant="primary"
            size="md"
            onClick={() => onNavigate(7)}
            icon={<ArrowRight size={15} />}
          >
            Launch Continuous Video Fallback (Screen 7) →
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
