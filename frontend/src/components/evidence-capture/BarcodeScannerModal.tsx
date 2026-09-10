import React, { useEffect, useRef, useState } from 'react';
import { X, ScanLine, AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { useEvidenceCapture } from '../../context/EvidenceCaptureContext';
import { GlassButton } from '../common/GlassButton';

interface BarcodeScannerModalProps {
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose }) => {
  const { setBarcodeResult } = useEvidenceCapture();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let active = true;
    codeReaderRef.current = new BrowserMultiFormatReader();

    const startScanning = async () => {
      try {
        if (!videoRef.current) return;
        
        await codeReaderRef.current?.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result: Result | null, err: Error | undefined) => {
            if (result && active && isScanning) {
              active = false;
              setIsScanning(false);
              
              // Handle successful scan
              setBarcodeResult({
                rawValue: result.getText(),
                symbology: result.getBarcodeFormat().toString(),
                capturedAt: Date.now()
              });
              
              // Play a beep sound if desired, or just close
              setTimeout(() => {
                onClose();
              }, 500);
            }
            if (err && err.name !== 'NotFoundException') {
              // Ignore NotFoundException (no barcode in frame)
              console.warn(err);
            }
          }
        );
      } catch (err) {
        if (active) {
          setError("Unable to access camera or start scanner.");
        }
      }
    };

    startScanning();

    return () => {
      active = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [onClose, setBarcodeResult, isScanning]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
      <div className="absolute top-4 right-4 z-10 text-white">
        <button onClick={onClose} className="p-2 bg-slate-800/50 rounded-full hover:bg-slate-700/50 backdrop-blur cursor-pointer">
          <X size={24} />
        </button>
      </div>

      <div className="w-full max-w-md p-6 flex flex-col items-center">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <ScanLine className="text-teal-400" />
            Scan Barcode / QR
          </h2>
          <p className="text-slate-300 text-sm">Align the barcode within the frame to scan automatically.</p>
        </div>

        <div className="relative w-full aspect-square max-w-[300px] rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-2xl">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center">
              <AlertCircle size={32} className="mb-2" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-[3px] border-dashed border-teal-400/70 m-8 rounded-xl pointer-events-none" />
              {/* Scanning line animation */}
              <div className="absolute top-8 left-8 right-8 h-1 bg-teal-400/80 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
            </>
          )}
          
          {!isScanning && !error && (
             <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center backdrop-blur-sm">
               <div className="bg-emerald-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                 Code Detected!
               </div>
             </div>
          )}
        </div>

        <div className="mt-8 w-full flex justify-center">
          <GlassButton variant="secondary" onClick={onClose}>
            Cancel
          </GlassButton>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(300px - 4rem)); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
