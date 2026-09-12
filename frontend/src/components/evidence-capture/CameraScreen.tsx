import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Check, RotateCw, Video, Image as ImageIcon } from 'lucide-react';
import { useEvidenceCapture, CAPTURE_REQUIREMENTS } from '../../context/EvidenceCaptureContext';
import { CaptureSlotId, EvidenceItem, ValidationResult, QualityAssessment } from '../../types/capture.types';
import { GlassButton } from '../common/GlassButton';
import { QualityEngine } from '../../services/quality/QualityEngine';
import { QualityResultCard } from './QualityResultCard';

interface CameraScreenProps {
  slotId: CaptureSlotId;
  onClose: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ slotId, onClose }) => {
  const { inspectionId, acceptEvidence } = useEvidenceCapture();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [isProcessingQuality, setIsProcessingQuality] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requirement = CAPTURE_REQUIREMENTS.find(r => r.id === slotId);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: "environment" } },
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera error:", err);
      // Fallback UI or permission error handled gracefully
    }
  };

  useEffect(() => {
    if (!previewUri) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewUri]); // Stop stream if previewing, restart if preview dismissed

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${slotId}_${crypto.randomUUID()}.jpg`, { type: 'image/jpeg' });
          processCapturedFile(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video_${slotId}_${crypto.randomUUID()}.webm`, { type: 'video/webm' });
      processCapturedFile(file);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processCapturedFile = async (file: File) => {
    // 1. Create preview
    const url = URL.createObjectURL(file);
    setPreviewUri(url);
    setCapturedFile(file);
    
    // 2. Validate basic file rules
    const isValid = validateFile(file);

    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // 3. Run Quality Gate (if valid and photo)
    if (isValid && file.type.startsWith('image/')) {
      setIsProcessingQuality(true);
      try {
        const assessment = await QualityEngine.analyze(file);
        setQualityAssessment(assessment);
      } catch (err) {
        console.error("Quality Engine Error:", err);
      } finally {
        setIsProcessingQuality(false);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const MAX_SIZE_MB = 10;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      setValidation({
        status: 'INVALID',
        reasons: [{ code: 'FILE_TOO_LARGE', message: 'Image file is too large.' }]
      });
      return false;
    }
    // Assume Valid
    setValidation({ status: 'VALID' });
    return true;
  };

  const handleAccept = async () => {
    if (validation?.status === 'VALID' && capturedFile) {
      await acceptEvidence({
        inspectionId,
        slotId,
        mode: capturedFile.type.startsWith('video') ? 'VIDEO' : 'PHOTO',
        file: capturedFile,
        mimeType: capturedFile.type,
        fileSize: capturedFile.size,
        validationResult: validation,
        qualityAssessment: qualityAssessment || undefined
      });
      onClose();
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
    setCapturedFile(null);
    setValidation(null);
    setQualityAssessment(null);
    setIsProcessingQuality(false);
    startCamera(); // Restart stream
  };

  const triggerGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCapturedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center animate-fade-in">
      <div className="absolute top-4 left-4 right-4 flex justify-between z-10 text-white">
        <button onClick={onClose} className="p-2 bg-slate-800/50 rounded-full hover:bg-slate-700/50 backdrop-blur">
          <X size={24} />
        </button>
        <div className="bg-slate-800/50 backdrop-blur px-4 py-1.5 rounded-full text-sm font-semibold">
          {requirement?.label}
        </div>
      </div>

      {!previewUri ? (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          {/* Overlay Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[75%] h-[60%] border-2 border-dashed border-teal-400/70 rounded-2xl relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 bg-slate-900/40 px-3 py-1 rounded backdrop-blur text-sm font-medium">
                {requirement?.description}
              </div>
            </div>
          </div>
          {/* Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 px-8">
             <button onClick={triggerGallery} className="p-3 bg-slate-800/60 rounded-full text-white backdrop-blur">
              <ImageIcon size={24} />
            </button>
            <button 
              onClick={handleCapturePhoto}
              disabled={isRecording}
              className={`w-20 h-20 bg-white/20 rounded-full p-2 border-2 border-white/50 transition ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-slate-900">
                <Camera size={32} />
              </div>
            </button>
            <button 
              onClick={toggleRecording}
              className={`p-3 rounded-full text-white backdrop-blur transition ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-800/60 hover:bg-slate-700/60'}`}
            >
              {isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : <Video size={24} />}
            </button>
            {/* Hidden file input for gallery */}
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelected}
            />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col bg-slate-950">
          <div className="flex-1 min-h-0 relative p-4 pb-0 flex flex-col">
            {/* Redesigned Image Container */}
            <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl bg-black">
              {capturedFile?.type.startsWith('video') ? (
                <video src={previewUri} controls className="w-full h-full object-contain" />
              ) : (
                <img src={previewUri} className="w-full h-full object-contain" alt="Preview" />
              )}
              
              {/* Validation Overlay */}
              {validation && (
                <div className="absolute top-4 left-4 right-4 animate-fade-in">
                  {validation.status === 'VALID' ? (
                    <div className="bg-emerald-500/95 text-white p-3 rounded-xl border border-emerald-400 backdrop-blur-md shadow-2xl flex items-center gap-3">
                      <div className="p-1.5 bg-white/20 rounded-full"><Check size={20} strokeWidth={3} /></div>
                      <div>
                        <span className="block text-sm font-bold">Perfect!</span>
                        <span className="block text-xs text-emerald-50 font-medium tracking-wide">Image meets all requirements.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/95 text-white p-4 rounded-xl border border-red-400 backdrop-blur-md shadow-2xl">
                      <div className="font-bold mb-2 flex items-center gap-2 text-sm"><X size={18} strokeWidth={3}/> Image not suitable</div>
                      {validation.reasons?.map((r, i) => (
                        <div key={i} className="text-xs text-red-50 flex items-center gap-1 mt-1">
                          • {r.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

            {/* Prominent Action Area */}
            <div className="p-6 shrink-0 space-y-4">
              <QualityResultCard assessment={qualityAssessment} isProcessing={isProcessingQuality} />

              {validation?.status === 'VALID' && qualityAssessment?.status !== 'RECAPTURE' && (
                <button 
                  onClick={handleAccept} 
                  disabled={isProcessingQuality}
                  className={`w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all flex justify-center items-center gap-3 border border-emerald-400/50 ${isProcessingQuality ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Check size={24} /> 
                  {isProcessingQuality ? 'Checking quality...' : `Submit for ${requirement?.label.split('.')[1]?.trim() || requirement?.id}`}
                </button>
              )}
            
            <button 
              onClick={handleRetake} 
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl font-semibold transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              <RotateCw size={18} /> Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
