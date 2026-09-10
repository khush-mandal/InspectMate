import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { 
  CaptureSlotId, 
  CaptureMode, 
  EvidenceItem, 
  ValidationResult, 
  BarcodeResult,
  CaptureRequirement
} from '../types/capture.types';
import { saveEvidenceLocally, getEvidenceForInspection, deleteEvidenceLocally } from '../services/evidenceStorage.service';
import { uploadEvidenceAPI } from '../services/evidenceApi.service';

export const CAPTURE_REQUIREMENTS: CaptureRequirement[] = [
  { id: 'FRONT', label: '1. Front (PDP)', description: 'Capture the front of the package.', required: true },
  { id: 'BACK', label: '2. Back Panel', description: 'Capture the back where mandatory declarations may appear.', required: true },
  { id: 'SIDE', label: '3. Side / Date Stamp', description: 'Capture the side panel if additional declarations are present.', required: false }
];

interface EvidenceCaptureState {
  inspectionId: string;
  evidence: Record<string, EvidenceItem>;
  currentSlot: CaptureSlotId | null;
  captureMode: CaptureMode | null;
  barcodeResult: BarcodeResult | null;
}

interface EvidenceCaptureContextType extends EvidenceCaptureState {
  startCaptureSession: (inspectionId: string) => void;
  selectSlot: (slotId: CaptureSlotId) => void;
  setCaptureMode: (mode: CaptureMode | null) => void;
  acceptEvidence: (item: EvidenceItem) => void;
  removeEvidence: (slotId: CaptureSlotId) => void;
  setBarcodeResult: (result: BarcodeResult | null) => void;
  resetSession: () => void;
  summary: {
    requiredCompleted: number;
    requiredTotal: number;
    optionalCompleted: number;
    totalEvidence: number;
    readyForNextPhase: boolean;
  };
}

const EvidenceCaptureContext = createContext<EvidenceCaptureContextType | undefined>(undefined);

export const EvidenceCaptureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EvidenceCaptureState>({
    inspectionId: '',
    evidence: {},
    currentSlot: null,
    captureMode: null,
    barcodeResult: null
  });

  const startCaptureSession = useCallback(async (inspectionId: string) => {
    // Load offline evidence if any exists for this inspection
    const offlineEvidence = await getEvidenceForInspection(inspectionId);
    const evidenceMap: Record<string, EvidenceItem> = {};
    offlineEvidence.forEach(e => {
      // Recreate Object URLs for files if they were stored (for preview)
      if (e.file && !e.localUri.startsWith('blob:')) {
         e.localUri = URL.createObjectURL(e.file);
      }
      evidenceMap[e.slotId] = e;
    });

    setState({
      inspectionId,
      evidence: evidenceMap,
      currentSlot: null,
      captureMode: null,
      barcodeResult: null
    });
  }, []);

  const selectSlot = useCallback((slotId: CaptureSlotId) => {
    setState(prev => ({ ...prev, currentSlot: slotId }));
  }, []);

  const setCaptureMode = useCallback((mode: CaptureMode | null) => {
    setState(prev => ({ ...prev, captureMode: mode }));
  }, []);

  const acceptEvidence = useCallback(async (item: EvidenceItem) => {
    // 1. Save locally to IndexedDB for offline support
    await saveEvidenceLocally(item);

    // 2. Update state to reflect it's pending
    setState(prev => ({
      ...prev,
      evidence: {
        ...prev.evidence,
        [item.slotId]: item
      },
      currentSlot: null,
      captureMode: null
    }));

    // 3. Attempt Background Sync/Upload
    try {
      const result = await uploadEvidenceAPI(item);
      const updatedItem = { 
        ...item, 
        syncStatus: 'SYNCED' as const, 
        serverEvidenceId: result.serverEvidenceId 
      };
      await saveEvidenceLocally(updatedItem);
      
      setState(prev => ({
        ...prev,
        evidence: {
          ...prev.evidence,
          [updatedItem.slotId]: updatedItem
        }
      }));
    } catch (err) {
      const failedItem = { ...item, syncStatus: 'SYNC_FAILED' as const };
      await saveEvidenceLocally(failedItem);
      setState(prev => ({
        ...prev,
        evidence: {
          ...prev.evidence,
          [failedItem.slotId]: failedItem
        }
      }));
    }
  }, []);

  const removeEvidence = useCallback(async (slotId: CaptureSlotId) => {
    const item = state.evidence[slotId];
    if (item) {
      await deleteEvidenceLocally(item.evidenceId);
    }
    setState(prev => {
      const newEvidence = { ...prev.evidence };
      delete newEvidence[slotId];
      return { ...prev, evidence: newEvidence };
    });
  }, [state.evidence]);

  const setBarcodeResult = useCallback((result: BarcodeResult | null) => {
    setState(prev => ({ ...prev, barcodeResult: result }));
  }, []);

  const resetSession = useCallback(() => {
    setState({
      inspectionId: '',
      evidence: {},
      currentSlot: null,
      captureMode: null,
      barcodeResult: null
    });
  }, []);

  const summary = useMemo(() => {
    let requiredCompleted = 0;
    let requiredTotal = 0;
    let optionalCompleted = 0;

    CAPTURE_REQUIREMENTS.forEach(req => {
      if (req.required) requiredTotal++;
      
      const item = state.evidence[req.id];
      if (item && item.validationResult.status === 'VALID') {
        if (req.required) {
          requiredCompleted++;
        } else {
          optionalCompleted++;
        }
      }
    });

    const totalEvidence = Object.keys(state.evidence).length;
    const readyForNextPhase = requiredCompleted === requiredTotal;

    return {
      requiredCompleted,
      requiredTotal,
      optionalCompleted,
      totalEvidence,
      readyForNextPhase
    };
  }, [state.evidence]);

  return (
    <EvidenceCaptureContext.Provider value={{
      ...state,
      startCaptureSession,
      selectSlot,
      setCaptureMode,
      acceptEvidence,
      removeEvidence,
      setBarcodeResult,
      resetSession,
      summary
    }}>
      {children}
    </EvidenceCaptureContext.Provider>
  );
};

export const useEvidenceCapture = () => {
  const context = useContext(EvidenceCaptureContext);
  if (context === undefined) {
    throw new Error('useEvidenceCapture must be used within an EvidenceCaptureProvider');
  }
  return context;
};
