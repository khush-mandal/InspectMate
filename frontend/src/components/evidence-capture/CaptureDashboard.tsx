import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Camera, 
  Check, 
  RefreshCw, 
  HardDrive, 
  CloudCheck, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { useEvidenceCapture, CAPTURE_REQUIREMENTS } from '../../context/EvidenceCaptureContext';
import { CaptureSlotId } from '../../types/capture.types';

interface CaptureDashboardProps {
  onCaptureRequested: (slotId: CaptureSlotId) => void;
}

export const CaptureDashboard: React.FC<CaptureDashboardProps> = ({ onCaptureRequested }) => {
  const { inspectionId, evidence, summary, retryEvidence } = useEvidenceCapture();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">EVIDENCE CAPTURE</h2>
          <p className="text-sm text-slate-600 font-mono">Inspection: {inspectionId}</p>
        </div>
        <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-semibold border border-indigo-100">
          {summary.requiredCompleted} of {summary.requiredTotal} required captured
        </div>
      </div>

      <div className="grid gap-4">
        {CAPTURE_REQUIREMENTS.map((req) => {
          const item = evidence[req.id];
          const isCaptured = item && item.validationResult.status === 'VALID';
          const isInvalid = item && item.validationResult.status === 'INVALID';

          return (
            <GlassCard 
              key={req.id} 
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 transition-all" 
              style={{ 
                borderLeftColor: isCaptured 
                  ? (item?.syncStatus === 'SYNCED' ? '#10b981' : item?.syncStatus === 'SYNC_FAILED' ? '#ef4444' : '#f59e0b') 
                  : req.required ? '#6366f1' : '#cbd5e1' 
              }}
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                {isCaptured && item?.localUri ? (
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs bg-black">
                    {item.mode === 'VIDEO' ? (
                      <video src={item.localUri} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.localUri} alt={req.label} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                      <Check size={10} strokeWidth={4} />
                    </div>
                  </div>
                ) : isCaptured ? (
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                ) : isInvalid ? (
                  <AlertCircle className="text-red-500 shrink-0" size={24} />
                ) : (
                  <Circle className="text-slate-300 shrink-0" size={24} />
                )}
                
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{req.label}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {isCaptured ? (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check size={12} /> Saved on device
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold ${req.required ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {req.required ? '○ Required' : '○ Optional'}
                      </span>
                    )}

                    {/* Sync Status Badges */}
                    {item?.syncStatus === 'SYNCED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CloudCheck size={11} /> Synced
                      </span>
                    )}

                    {item?.syncStatus === 'SYNC_PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <HardDrive size={11} /> Waiting to sync
                      </span>
                    )}

                    {item?.syncStatus === 'SYNCING' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse">
                        <RefreshCw size={11} className="animate-spin" /> Syncing...
                      </span>
                    )}

                    {item?.syncStatus === 'SYNC_FAILED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
                        <AlertTriangle size={11} /> Sync failed
                      </span>
                    )}

                    {isInvalid && (
                      <span className="text-xs text-red-500 font-medium">Needs attention</span>
                    )}
                  </div>

                  {item?.syncStatus === 'SYNC_FAILED' && item.lastErrorMessage && (
                    <p className="text-[11px] text-red-600 mt-1 truncate">
                      {item.lastErrorMessage}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {item?.syncStatus === 'SYNC_FAILED' && (
                  <button
                    onClick={() => retryEvidence(req.id)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <RotateCcw size={12} /> Retry
                  </button>
                )}

                <GlassButton 
                  variant={isCaptured ? "secondary" : "primary"} 
                  size="sm"
                  onClick={() => onCaptureRequested(req.id)}
                  icon={<Camera size={14} />}
                >
                  {isCaptured ? 'Retake' : `Capture ${req.label.split('.')[1]?.trim() || req.id}`}
                </GlassButton>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
