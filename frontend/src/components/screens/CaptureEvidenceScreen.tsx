import React, { useEffect, useState } from 'react';
import { ArrowRight, ScanBarcode } from 'lucide-react';
import { ProductSample } from '../../types';
import { CaptureDashboard } from '../evidence-capture/CaptureDashboard';
import { CameraScreen } from '../evidence-capture/CameraScreen';
import { BarcodeScannerModal } from '../evidence-capture/BarcodeScannerModal';
import { useEvidenceCapture } from '../../context/EvidenceCaptureContext';
import { GlassButton } from '../common/GlassButton';
import { CaptureSlotId } from '../../types/capture.types';

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
  const { startCaptureSession, currentSlot, selectSlot, summary, barcodeResult } = useEvidenceCapture();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Initialize session when screen mounts
  useEffect(() => {
    // We assume an inspectionId is already present in App context, but we use product.id + timestamp as fallback if needed.
    // Or we rely on the App context having already set a session. For now, we'll start one based on product ID to simulate.
    startCaptureSession(`INS-${product.id}`);
  }, [product.id, startCaptureSession]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Capture Evidence
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Guided capture for statutory declarations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="secondary"
            size="md"
            onClick={() => setShowBarcodeScanner(true)}
            icon={<ScanBarcode size={16} />}
          >
            Scan Barcode
          </GlassButton>
          <GlassButton
            variant={summary.readyForNextPhase ? "primary" : "secondary"}
            size="md"
            onClick={onProceed}
            icon={<ArrowRight size={16} />}
            disabled={!summary.readyForNextPhase}
          >
            Quality Gate →
          </GlassButton>
        </div>
      </div>

      {/* Optional: Show Barcode Result */}
      {barcodeResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold text-emerald-800">Barcode Scanned: </span>
            <span className="text-emerald-900 font-mono">{barcodeResult.rawValue}</span>
          </div>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded">
            {barcodeResult.symbology}
          </span>
        </div>
      )}

      {/* Evidence Capture Module Dashboard */}
      <div className="mt-8">
        <CaptureDashboard 
          onCaptureRequested={(slotId: CaptureSlotId) => selectSlot(slotId)} 
        />
      </div>

      {/* Modals */}
      {currentSlot && (
        <CameraScreen 
          slotId={currentSlot} 
          onClose={() => selectSlot(null as any)} 
        />
      )}

      {showBarcodeScanner && (
        <BarcodeScannerModal 
          onClose={() => setShowBarcodeScanner(false)} 
        />
      )}
    </div>
  );
};
