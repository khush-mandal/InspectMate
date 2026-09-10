import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Camera, Check } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { useEvidenceCapture, CAPTURE_REQUIREMENTS } from '../../context/EvidenceCaptureContext';
import { CaptureSlotId } from '../../types/capture.types';

interface CaptureDashboardProps {
  onCaptureRequested: (slotId: CaptureSlotId) => void;
}

export const CaptureDashboard: React.FC<CaptureDashboardProps> = ({ onCaptureRequested }) => {
  const { inspectionId, evidence, summary } = useEvidenceCapture();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">EVIDENCE CAPTURE</h2>
          <p className="text-sm text-slate-600">Inspection: {inspectionId}</p>
        </div>
        <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100">
          {summary.requiredCompleted} of {summary.requiredTotal} required complete
        </div>
      </div>

      <div className="grid gap-4">
        {CAPTURE_REQUIREMENTS.map((req) => {
          const item = evidence[req.id];
          const isCaptured = item && item.validationResult.status === 'VALID';
          const isInvalid = item && item.validationResult.status === 'INVALID';

          return (
            <GlassCard key={req.id} className="p-4 flex items-center justify-between border-l-4" style={{ borderLeftColor: isCaptured ? '#10b981' : req.required ? '#6366f1' : '#cbd5e1' }}>
              <div className="flex items-center gap-4">
                {isCaptured && item?.localUri ? (
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-black">
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
                
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{req.label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {isCaptured ? (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check size={12} /> Captured
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold ${req.required ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {req.required ? '○ Required' : '○ Optional'}
                      </span>
                    )}
                    {isInvalid && (
                      <span className="text-xs text-red-500 ml-2">Needs attention</span>
                    )}
                    {item?.syncStatus === 'SYNC_PENDING' && (
                      <span className="text-xs text-amber-600 ml-2">Pending sync</span>
                    )}
                  </div>
                </div>
              </div>
              
              <GlassButton 
                variant={isCaptured ? "secondary" : "primary"} 
                size="sm"
                onClick={() => onCaptureRequested(req.id)}
                icon={<Camera size={14} />}
              >
                {isCaptured ? 'Retake' : `Capture ${req.label.split('.')[1]?.trim() || req.id}`}
              </GlassButton>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
