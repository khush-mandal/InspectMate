export type SyncState = 'LOCAL_ONLY' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED';

export interface SyncMetadata {
  syncState: SyncState;
  lastSyncAttempt?: Date;
  errorCategory?: string;
  idempotencyKey?: string;
}

export type InspectionStatus = 
  | 'DRAFT' 
  | 'EVIDENCE_CAPTURE' 
  | 'EXTRACTION' 
  | 'COMPLIANCE_PENDING' 
  | 'REVIEW_REQUIRED' 
  | 'COMPLETED' 
  | 'SYNC_PENDING' 
  | 'SYNCED' 
  | 'SYNC_FAILED';

export interface Package {
  id: string;
  gtin: string;
  productName: string;
  brand?: string;
  company?: string;
  category?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inspection {
  id: string;
  inspectorId: string;
  packageId?: string;
  status: InspectionStatus;
  syncMetadata: SyncMetadata;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EvidenceType = 'IMAGE' | 'VIDEO' | 'VIDEO_FRAME';

export interface EvidenceMetadata {
  mimeType: string;
  filename: string;
  localFilePath: string;
  storageKey?: string;
  size: number;
  sha256: string;
  captureTimestamp: Date;
  deviceMetadata?: Record<string, any>;
  qualityResult?: Record<string, any>;
  sourceEvidenceId?: string;
  state: 'LOCAL' | 'UPLOADED' | 'SYNC_FAILED';
}

export interface Evidence {
  id: string;
  inspectionId: string;
  type: EvidenceType;
  metadata: EvidenceMetadata;
  syncMetadata: SyncMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractedField {
  fieldName: string;
  value: string;
  normalizedValue?: string;
  confidence: number;
  sourceEvidenceId: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  extractionMethod: string;
  needsVerification: boolean;
  barcodeReferenceValue?: string;
  hasConflict?: boolean;
  visionCrossCheck?: string;
}

export interface OCRResult {
  id: string;
  inspectionId: string;
  evidenceId: string;
  fields: ExtractedField[];
  modelVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarcodeResult {
  id: string;
  inspectionId: string;
  evidenceId: string;
  format: string;
  rawValue: string;
  normalizedValue?: string;
  confidence: number;
  detectedAt?: Date;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lookupStatus?: 'SUCCESS' | 'NOT_FOUND' | 'PENDING' | 'ERROR';
  decodedData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationResult {
  id: string;
  inspectionId: string;
  fieldComparisons: Array<{
    field: string;
    extractedValue?: string;
    referenceValue?: string;
    isMatch: boolean;
  }>;
  overallMatch: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceEvaluation {
  id: string;
  inspectionId: string;
  overallStatus: 'PASS' | 'FAIL' | 'REVIEW_NEEDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleEvaluation {
  id: string;
  complianceEvaluationId: string;
  ruleId: string;
  status: 'PASS' | 'FAIL' | 'N_A';
  evidenceIds: string[];
}

export interface Violation {
  id: string;
  complianceEvaluationId: string;
  ruleEvaluationId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export type FinalDecisionState = 
  | 'DRAFT' 
  | 'UNDER_REVIEW' 
  | 'REQUIRES_EVIDENCE' 
  | 'COMPLIANT' 
  | 'NON_COMPLIANT' 
  | 'INCONCLUSIVE' 
  | 'CLOSED';

export type FieldReviewAction = 'ACCEPT' | 'EDIT' | 'MARK_UNREADABLE' | 'REQUEST_RECAPTURE';
export type FieldReviewStatus = 'PENDING' | 'ACCEPTED' | 'EDITED' | 'UNREADABLE' | 'RECAPTURE_REQUESTED';

export type ViolationReviewAction = 'CONFIRM' | 'REJECT' | 'REQUEST_ADDITIONAL_EVIDENCE';
export type ViolationReviewStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REQUIRES_EVIDENCE';

export interface ReviewableField {
  fieldId: string;
  fieldName: string;
  machineValue: string;
  inspectorValue?: string;
  confidence: number;
  status: FieldReviewStatus;
  notes?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  sourceAngle?: string;
  sourceEvidenceId?: string;
  ruleReference?: string;
}

export interface ReviewableViolation {
  violationId: string;
  ruleId: string;
  ruleName: string;
  regulationReference: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: ViolationReviewStatus;
  overrideReason?: string;
  affectedFields?: string[];
  evidenceIds?: string[];
}

export interface FieldModificationRecord {
  fieldName: string;
  originalValue: string;
  newValue: string;
  action: FieldReviewAction;
  reason?: string;
  timestamp: string | Date;
}

export interface ViolationDecisionRecord {
  violationId: string;
  ruleId: string;
  action: ViolationReviewAction;
  reason?: string;
  timestamp: string | Date;
}

export interface InspectorDecision {
  id: string;
  inspectionId: string;
  inspectorId: string;
  decision: FinalDecisionState;
  reason: string;
  changedFields: FieldModificationRecord[];
  violationDecisions?: ViolationDecisionRecord[];
  timestamp: string | Date;
  violationId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

