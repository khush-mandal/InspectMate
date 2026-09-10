import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { 
  CaptureSlotId, 
  CaptureMode, 
  LocalEvidenceRecord, 
  ValidationResult, 
  BarcodeResult,
  CaptureRequirement,
  SyncSummary
} from '../types/capture.types';
import { evidenceRepository, SaveEvidenceInput } from '../services/EvidenceRepository';
import { syncCoordinator } from '../services/sync/SyncCoordinator';
import { useAuth } from './AuthContext';

export const CAPTURE_REQUIREMENTS: CaptureRequirement[] = [
  { id: 'FRONT', label: '1. Front (PDP)', description: 'Capture the front of the package.', required: true },
  { id: 'BACK', label: '2. Back Panel', description: 'Capture the back where mandatory declarations may appear.', required: true },
  { id: 'SIDE', label: '3. Side / Date Stamp', description: 'Capture the side panel if additional declarations are present.', required: false }
];

interface EvidenceCaptureState {
  inspectionId: string;
  evidence: Record<string, LocalEvidenceRecord>;
  currentSlot: CaptureSlotId | null;
  captureMode: CaptureMode | null;
  barcodeResult: BarcodeResult | null;
  syncSummary: SyncSummary;
  isSyncing: boolean;
}

interface EvidenceCaptureContextType extends EvidenceCaptureState {
  startCaptureSession: (inspectionId: string) => void;
  selectSlot: (slotId: CaptureSlotId | null) => void;
  setCaptureMode: (mode: CaptureMode | null) => void;
  acceptEvidence: (input: Omit<SaveEvidenceInput, 'userId'>) => Promise<void>;
  retryEvidence: (slotId: CaptureSlotId) => Promise<void>;
  removeEvidence: (slotId: CaptureSlotId) => Promise<void>;
  setBarcodeResult: (result: BarcodeResult | null) => void;
  syncNow: () => Promise<void>;
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
  const { user, token } = useAuth();
  const userId = user?.id || 'guest_user';

  const [state, setState] = useState<EvidenceCaptureState>({
    inspectionId: '',
    evidence: {},
    currentSlot: null,
    captureMode: null,
    barcodeResult: null,
    syncSummary: {
      total: 0,
      synced: 0,
      pending: 0,
      syncing: 0,
      failed: 0,
      localOnly: 0,
      isFullySynced: true
    },
    isSyncing: false
  });

  // Sync coordinator session setup
  useEffect(() => {
    syncCoordinator.setSession(userId, token);
  }, [userId, token]);

  const loadEvidenceForInspection = useCallback(async (inspectionId: string) => {
    if (!inspectionId) return;
    const items = await evidenceRepository.getEvidenceForInspection(inspectionId, userId);
    const map: Record<string, LocalEvidenceRecord> = {};
    items.forEach(item => {
      map[item.slotId] = item;
    });

    const summary = await syncCoordinator.getSyncSummary(inspectionId);

    setState(prev => ({
      ...prev,
      inspectionId,
      evidence: map,
      syncSummary: summary,
      isSyncing: summary.syncing > 0
    }));
  }, [userId]);

  // Subscribe to real-time sync coordinator events
  useEffect(() => {
    const unsubscribe = syncCoordinator.subscribe(() => {
      if (state.inspectionId) {
        loadEvidenceForInspection(state.inspectionId);
      }
    });
    return unsubscribe;
  }, [state.inspectionId, loadEvidenceForInspection]);

  const startCaptureSession = useCallback((inspectionId: string) => {
    loadEvidenceForInspection(inspectionId);
  }, [loadEvidenceForInspection]);

  const selectSlot = useCallback((slotId: CaptureSlotId | null) => {
    setState(prev => ({ ...prev, currentSlot: slotId }));
  }, []);

  const setCaptureMode = useCallback((mode: CaptureMode | null) => {
    setState(prev => ({ ...prev, captureMode: mode }));
  }, []);

  const acceptEvidence = useCallback(async (input: Omit<SaveEvidenceInput, 'userId'>) => {
    const savedRecord = await evidenceRepository.saveEvidence({
      ...input,
      userId
    });

    setState(prev => ({
      ...prev,
      evidence: {
        ...prev.evidence,
        [savedRecord.slotId]: savedRecord
      },
      currentSlot: null,
      captureMode: null
    }));

    if (input.inspectionId) {
      loadEvidenceForInspection(input.inspectionId);
    }
  }, [userId, loadEvidenceForInspection]);

  const retryEvidence = useCallback(async (slotId: CaptureSlotId) => {
    const item = state.evidence[slotId];
    if (item) {
      await evidenceRepository.retryFailedEvidence(item.clientEvidenceId, userId);
      if (state.inspectionId) {
        loadEvidenceForInspection(state.inspectionId);
      }
    }
  }, [state.evidence, state.inspectionId, userId, loadEvidenceForInspection]);

  const removeEvidence = useCallback(async (slotId: CaptureSlotId) => {
    const item = state.evidence[slotId];
    if (item) {
      await evidenceRepository.removeEvidence(item.clientEvidenceId);
    }
    setState(prev => {
      const newEvidence = { ...prev.evidence };
      delete newEvidence[slotId];
      return { ...prev, evidence: newEvidence };
    });
    if (state.inspectionId) {
      loadEvidenceForInspection(state.inspectionId);
    }
  }, [state.evidence, state.inspectionId, loadEvidenceForInspection]);

  const setBarcodeResult = useCallback((result: BarcodeResult | null) => {
    setState(prev => ({ ...prev, barcodeResult: result }));
  }, []);

  const syncNow = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true }));
    const summary = await evidenceRepository.syncNow();
    if (state.inspectionId) {
      await loadEvidenceForInspection(state.inspectionId);
    }
    setState(prev => ({ ...prev, syncSummary: summary, isSyncing: false }));
  }, [state.inspectionId, loadEvidenceForInspection]);

  const resetSession = useCallback(() => {
    setState({
      inspectionId: '',
      evidence: {},
      currentSlot: null,
      captureMode: null,
      barcodeResult: null,
      syncSummary: {
        total: 0,
        synced: 0,
        pending: 0,
        syncing: 0,
        failed: 0,
        localOnly: 0,
        isFullySynced: true
      },
      isSyncing: false
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
      retryEvidence,
      removeEvidence,
      setBarcodeResult,
      syncNow,
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
