import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl transition shadow-xs"
          title="Install InspectMate PWA for offline inspections"
        >
          <Download size={14} />
          <span>Install PWA</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/70 hover:bg-white/90 border border-slate-200 rounded-xl transition shadow-xs"
        >
          <Smartphone size={14} />
          <span>Install on iOS</span>
        </button>
      ) : (
        <button
          onClick={() => {
            alert('InspectMate PWA is ready. In your browser menu, select "Install InspectMate" or "Add to Home Screen".');
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white/60 hover:bg-white/90 border border-slate-200 rounded-xl transition"
        >
          <Smartphone size={13} className="text-teal-600" />
          <span>PWA Ready</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="text-indigo-600" size={18} />
                Install InspectMate on iOS
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-600 space-y-2">
              <span>1. Tap the <strong>Share</strong> button in the Safari bottom bar.</span><br />
              <span>2. Scroll down and choose <strong>Add to Home Screen</strong>.</span><br />
              <span>3. Launch InspectMate from your home screen for full offline regulatory inspections.</span>
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
