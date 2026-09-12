import React, { useState, useEffect } from 'react';
import { TargetField, VideoProcessingJob, FrameCandidate } from '../../types/video.types';
import { CaptureSlotId } from '../../types/capture.types';
import { FrameExtractor } from '../../services/video/FrameExtractor';
import { BestFrameSelector } from '../../services/video/BestFrameSelector';
import { Check, Loader, XCircle, FileVideo, AlertCircle } from 'lucide-react';

interface Props {
  videoFile: File;
  videoId: string;
  slotId: CaptureSlotId;
  inspectionId: string;
  userId: string;
  onComplete: (job: VideoProcessingJob) => void;
  onCancel: () => void;
}

export const VideoProcessingOverlay: React.FC<Props> = ({ videoFile, videoId, slotId, inspectionId, userId, onComplete, onCancel }) => {
  const [job, setJob] = useState<VideoProcessingJob>({
    jobId: crypto.randomUUID(),
    videoId,
    inspectionId,
    status: 'QUEUED',
    processingVersion: 'v1.0',
    requestedFields: ['MRP', 'NET_QUANTITY', 'MANUFACTURER', 'DATE'],
    requestedAt: Date.now(),
    frameCount: 0,
    sampledFrameCount: 0,
    selectedFrameCount: 0,
    fieldResults: {},
    coverageStatus: 'NONE'
  });
  
  const [progress, setProgress] = useState({ processed: 0, total: 100 });
  const [stage, setStage] = useState<'EXTRACTING' | 'SELECTING' | 'DONE' | 'ERROR'>('EXTRACTING');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const runPipeline = async () => {
      try {
        setJob(prev => ({ ...prev, status: 'PROCESSING', startedAt: Date.now() }));
        setStage('EXTRACTING');

        const candidates = await FrameExtractor.extractFrames(videoFile, videoId, {
          sampleFps: 3,
          requestedFields: job.requestedFields,
          onProgress: (processed, total) => {
            if (!isCancelled) setProgress({ processed, total });
          }
        });

        if (isCancelled) return;

        setStage('SELECTING');
        const updatedJob = await BestFrameSelector.selectAndPersistBestFrames(
          { ...job, sampledFrameCount: candidates.length }, 
          candidates, 
          slotId, 
          userId
        );

        if (isCancelled) return;
        
        setStage('DONE');
        setJob(updatedJob);
        
      } catch (err: any) {
        if (isCancelled) return;
        setStage('ERROR');
        setErrorMsg(err.message || 'Unknown processing error');
        setJob(prev => ({ ...prev, status: 'FAILED', error: err.message }));
      }
    };

    runPipeline();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stage === 'DONE') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-6 animate-fade-in text-white overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 mt-12 flex items-center gap-3">
          <Check className="text-emerald-400" size={32} />
          BEST EVIDENCE FOUND
        </h2>

        <div className="space-y-4 mb-8 flex-1">
          {job.requestedFields.map(field => {
            const res = job.fieldResults[field];
            if (!res) return null;
            
            if ('status' in res && res.status === 'NO_USABLE_FRAME') {
              return (
                <div key={field} className="bg-slate-800 p-4 rounded-2xl border border-red-500/50">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <AlertCircle className="text-red-400" size={18} /> {field.replace('_', ' ')}
                  </div>
                  <p className="text-sm text-red-200">No usable frame found. {res.reason}</p>
                </div>
              );
            } else if ('bestFrameId' in res) {
              return (
                <div key={field} className="bg-slate-800 p-4 rounded-2xl border border-emerald-500/50 flex justify-between items-center">
                  <div>
                    <div className="font-bold mb-1">{field.replace('_', ' ')}</div>
                    <div className="text-sm text-slate-400">Score: {res.score} • Timestamp: {(res.timestampMs / 1000).toFixed(1)}s</div>
                    <div className="text-xs text-emerald-300 mt-1">{res.reason}</div>
                  </div>
                  <button className="px-4 py-2 bg-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-600">
                    VIEW
                  </button>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div className="space-y-3 shrink-0">
          <button 
            onClick={() => onComplete(job)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold shadow-lg transition-all"
          >
            CONTINUE
          </button>
          
          {job.coverageStatus !== 'FULL' && (
            <button 
              onClick={onCancel}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-semibold transition-all border border-slate-700"
            >
              CAPTURE ADDITIONAL EVIDENCE
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in text-white">
      <div className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center">
        
        {stage === 'ERROR' ? (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Processing Failed</h3>
            <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
            <button 
              onClick={onCancel}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <Loader size={48} className="text-emerald-400 mx-auto mb-6 animate-spin" />
            <h3 className="text-xl font-bold mb-2">Analyzing Video</h3>
            <p className="text-slate-400 text-sm mb-6">
              {stage === 'EXTRACTING' 
                ? `Extracting and analyzing frames (${progress.processed}/${progress.total})...` 
                : 'Selecting best frames for fields...'}
            </p>
            
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(5, (progress.processed / progress.total) * 100)}%` }}
              />
            </div>
            
            <button 
              onClick={onCancel}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel Processing
            </button>
          </>
        )}
      </div>
    </div>
  );
};
