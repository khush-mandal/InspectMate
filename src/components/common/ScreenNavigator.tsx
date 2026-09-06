import React from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Play, 
  Layers,
  Search,
  Sparkles
} from 'lucide-react';

export interface ScreenInfo {
  number: number;
  title: string;
  category: 'Foundation' | 'Evidence Capture' | 'AI & Vision' | 'Verification & Rules' | 'Enforcement & Analytics';
  description: string;
}

export const ALL_SCREENS: ScreenInfo[] = [
  { number: 1, title: 'Login & Authentication', category: 'Foundation', description: 'JWT auth, role-aware credentials redirect' },
  { number: 2, title: 'Inspector Dashboard', category: 'Foundation', description: 'Stat cards, pending reviews, quick actions' },
  { number: 3, title: 'New Inspection Form', category: 'Foundation', description: 'Auto ID, location, category, draft state' },
  { number: 4, title: 'Identify Product', category: 'Evidence Capture', description: 'Barcode, QR, image capture, video options' },
  { number: 5, title: 'Capture Evidence', category: 'Evidence Capture', description: 'Guided multi-angle capture with thumbnail strip' },
  { number: 6, title: 'Image Quality Check', category: 'Evidence Capture', description: '94% good vs 48% bad state with checks' },
  { number: 7, title: 'Video Fallback', category: 'Evidence Capture', description: '360° rotation capture & best keyframes' },
  { number: 8, title: 'OCR/CV Extraction Results', category: 'AI & Vision', description: 'Field cards, confidence rings, bounding boxes' },
  { number: 9, title: 'OCR Verification', category: 'AI & Vision', description: 'Side-by-side OCR vs vision cross-check' },
  { number: 10, title: 'Barcode/QR Data Lookup', category: 'AI & Vision', description: 'GS1 reference card: "Not automatic legal truth"' },
  { number: 11, title: 'Cross-Source Verification', category: 'Verification & Rules', description: 'Visual flow diagram: Consistent vs Inconsistency' },
  { number: 12, title: 'Compliance Checklist', category: 'Verification & Rules', description: 'Pass/Fail/Review per statutory declarations' },
  { number: 13, title: 'Evidence-Backed Finding Card', category: 'Verification & Rules', description: 'Rule ID, detected value, highlighted evidence' },
  { number: 14, title: 'Result Classification Badges', category: 'Verification & Rules', description: 'All 4 states: Verified, Violation, Inconsistent, Insufficient' },
  { number: 15, title: 'Inspector Review', category: 'Enforcement & Analytics', description: 'Adjudicate finding: Verify, Reject, Request More, Note' },
  { number: 16, title: 'Final Inspection Report', category: 'Enforcement & Analytics', description: 'Exportable official summary, signature, PDF preview' },
  { number: 17, title: 'Inspection History', category: 'Enforcement & Analytics', description: 'Searchable, filterable audit registry' },
  { number: 18, title: 'Regulatory Dashboard', category: 'Enforcement & Analytics', description: 'Aggregate 1,240 stats, manufacturer & trend charts' },
  { number: 19, title: 'Error & Edge-Case States', category: 'Enforcement & Analytics', description: 'Blurry, missing sides, OCR conflict, dual-pricing' },
];

interface ScreenNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: number;
  onSelectScreen: (screen: number) => void;
}

export const ScreenNavigator: React.FC<ScreenNavigatorProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onSelectScreen
}) => {
  if (!isOpen) return null;

  const categories = Array.from(new Set(ALL_SCREENS.map(s => s.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[26px] glass-panel border border-white/95 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">InspectMate Screen Navigator</h2>
              <p className="text-xs text-slate-500">19 screens covering the full regulatory inspection user journey</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Categories and screens list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {categories.map((category) => {
            const screensInCategory = ALL_SCREENS.filter(s => s.category === category);

            return (
              <div key={category} className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900/70 px-1">
                  {category}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {screensInCategory.map((screen) => {
                    const isCurrent = screen.number === currentScreen;

                    return (
                      <button
                        key={screen.number}
                        onClick={() => {
                          onSelectScreen(screen.number);
                          onClose();
                        }}
                        className={`
                          text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between
                          ${
                            isCurrent
                              ? 'bg-gradient-to-br from-indigo-50/90 to-teal-50/90 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                              : 'bg-white/70 hover:bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-xs'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono">
                            #{screen.number}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              Active View
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mb-1 leading-tight">
                          {screen.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-snug">
                          {screen.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Step Walkthrough */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-white/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-semibold text-slate-800">Inspection Journey:</span>
            <span>Screens 3 → 16 form the core continuous workflow</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentScreen > 1) {
                  onSelectScreen(currentScreen - 1);
                }
              }}
              disabled={currentScreen <= 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 font-semibold"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                if (currentScreen < 19) {
                  onSelectScreen(currentScreen + 1);
                }
              }}
              disabled={currentScreen >= 19}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 font-semibold"
            >
              Next Screen →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
