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

import { VisionApiClient, VisionExtractedFields } from '../services/vision/VisionApiClient';
import { ComplianceApiClient, StatutoryComplianceResponse } from '../services/compliance/complianceApi.service';
import { mediaBlobStore } from '../services/storage/MediaBlobStore';

export const CAPTURE_REQUIREMENTS: CaptureRequirement[] = [
  { id: 'FRONT', label: '1. Front (PDP)', description: 'Capture the front of the package.', required: true },
  { id: 'BACK', label: '2. Back Panel', description: 'Capture the back where mandatory declarations may appear.', required: true },
  { id: 'SIDE', label: '3. Side / Date Stamp', description: 'Capture the side panel if additional declarations are present.', required: false }
];

export interface EvidenceCaptureState {
  inspectionId: string;
  evidence: Record<string, LocalEvidenceRecord>;
  previewUrls: Record<string, string>;
  currentSlot: CaptureSlotId | null;
  captureMode: CaptureMode | null;
  barcodeResult: BarcodeResult | null;
  extractedData: VisionExtractedFields | null;
  complianceSummary: StatutoryComplianceResponse | null;
  isExtracting: boolean;
  isEvaluating: boolean;
  syncSummary: SyncSummary;
  isSyncing: boolean;
}

export interface EvidenceCaptureContextType extends EvidenceCaptureState {
  startCaptureSession: (inspectionId: string) => void;
  selectSlot: (slotId: CaptureSlotId | null) => void;
  setCaptureMode: (mode: CaptureMode | null) => void;
  acceptEvidence: (input: Omit<SaveEvidenceInput, 'userId'>) => Promise<void>;
  retryEvidence: (slotId: CaptureSlotId) => Promise<void>;
  removeEvidence: (slotId: CaptureSlotId) => Promise<void>;
  setBarcodeResult: (result: BarcodeResult | null) => void;
  syncNow: () => Promise<void>;
  resetSession: () => void;
  performLiveExtraction: () => Promise<VisionExtractedFields | null>;
  updateExtractedField: (field: keyof VisionExtractedFields, value: any) => void;
  reEvaluateCompliance: (data?: VisionExtractedFields) => Promise<StatutoryComplianceResponse | null>;
  setExtractedData: (data: VisionExtractedFields | null) => void;
  setComplianceSummary: (summary: StatutoryComplianceResponse | null) => void;
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
    previewUrls: {},
    currentSlot: null,
    captureMode: null,
    barcodeResult: null,
    extractedData: null,
    complianceSummary: null,
    isExtracting: false,
    isEvaluating: false,
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
    const previews: Record<string, string> = {};

    for (const item of items) {
      map[item.slotId] = item;
      try {
        const previewUrl = await mediaBlobStore.createPreviewUrl(item.localMediaId);
        if (previewUrl) {
          previews[item.slotId] = previewUrl;
        }
      } catch (err) {
        console.warn('Could not generate preview for media', item.localMediaId, err);
      }
    }

    const summary = await syncCoordinator.getSyncSummary(inspectionId);

    setState(prev => ({
      ...prev,
      inspectionId,
      evidence: map,
      previewUrls: { ...prev.previewUrls, ...previews },
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

    let previewUrl = '';
    try {
      const generated = await mediaBlobStore.createPreviewUrl(savedRecord.localMediaId);
      if (generated) previewUrl = generated;
    } catch (e) {
      console.warn('Could not generate preview URL:', e);
    }

    setState(prev => ({
      ...prev,
      evidence: {
        ...prev.evidence,
        [savedRecord.slotId]: savedRecord
      },
      previewUrls: previewUrl ? { ...prev.previewUrls, [savedRecord.slotId]: previewUrl } : prev.previewUrls,
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
      const newPreviews = { ...prev.previewUrls };
      delete newEvidence[slotId];
      delete newPreviews[slotId];
      return { ...prev, evidence: newEvidence, previewUrls: newPreviews };
    });
    if (state.inspectionId) {
      loadEvidenceForInspection(state.inspectionId);
    }
  }, [state.evidence, state.inspectionId, loadEvidenceForInspection]);

  const setBarcodeResult = useCallback((result: BarcodeResult | null) => {
    setState(prev => ({ ...prev, barcodeResult: result }));
  }, []);

  const setExtractedData = useCallback((data: VisionExtractedFields | null) => {
    setState(prev => ({ ...prev, extractedData: data }));
  }, []);

  const setComplianceSummary = useCallback((summary: StatutoryComplianceResponse | null) => {
    setState(prev => ({ ...prev, complianceSummary: summary }));
  }, []);

  const reEvaluateCompliance = useCallback(async (customData?: VisionExtractedFields): Promise<StatutoryComplianceResponse | null> => {
    const targetData = customData || state.extractedData;
    if (!targetData) return null;

    setState(prev => ({ ...prev, isEvaluating: true }));
    try {
      const summary = await ComplianceApiClient.evaluateDeclarations(targetData);
      setState(prev => ({ ...prev, complianceSummary: summary, isEvaluating: false }));
      return summary;
    } catch (err) {
      console.error('Failed to re-evaluate compliance:', err);
      setState(prev => ({ ...prev, isEvaluating: false }));
      return null;
    }
  }, [state.extractedData]);

  const performLiveExtraction = useCallback(async (): Promise<VisionExtractedFields | null> => {
    // Pick the best available slot: Back panel is highest probability for statutory declarations, then Front or Side
    const targetSlot: CaptureSlotId = state.evidence['BACK'] ? 'BACK' : state.evidence['FRONT'] ? 'FRONT' : 'SIDE';
    const record = state.evidence[targetSlot];

    if (!record) {
      console.warn('No evidence record available for extraction in slots');
      return null;
    }

    setState(prev => ({ ...prev, isExtracting: true }));

    try {
      const blob = await mediaBlobStore.getBlob(record.localMediaId);
      if (!blob) {
        throw new Error('Evidence blob not found in storage');
      }

      const extracted = await VisionApiClient.extractFields(blob);
      setState(prev => ({ ...prev, extractedData: extracted, isExtracting: false }));

      // Automatically evaluate compliance on extracted fields
      await reEvaluateCompliance(extracted);

      return extracted;
    } catch (error) {
      console.error('Error during live extraction:', error);
      setState(prev => ({ ...prev, isExtracting: false }));
      throw error;
    }
  }, [state.evidence, reEvaluateCompliance]);

  const updateExtractedField = useCallback((field: keyof VisionExtractedFields, value: any) => {
    setState(prev => {
      if (!prev.extractedData) return prev;
      const updated = {
        ...prev.extractedData,
        [field]: value
      };
      // Trigger background re-evaluation with updated field
      reEvaluateCompliance(updated);
      return {
        ...prev,
        extractedData: updated
      };
    });
  }, [reEvaluateCompliance]);

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
      previewUrls: {},
      currentSlot: null,
      captureMode: null,
      barcodeResult: null,
      extractedData: null,
      complianceSummary: null,
      isExtracting: false,
      isEvaluating: false,
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
      performLiveExtraction,
      updateExtractedField,
      reEvaluateCompliance,
      setExtractedData,
      setComplianceSummary,
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
