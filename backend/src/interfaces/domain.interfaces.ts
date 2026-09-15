import { Types } from 'mongoose';

export type SyncState = 'LOCAL_ONLY' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED';

export interface ISyncMetadata {
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

export interface IPackage {
  _id: Types.ObjectId;
  gtin: string;
  productName: string;
  brand?: string;
  company?: string;
  category?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInspection {
  _id: Types.ObjectId;
  inspectorId: string;
  packageId?: Types.ObjectId;
  status: InspectionStatus;
  syncMetadata: ISyncMetadata;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EvidenceType = 'IMAGE' | 'VIDEO' | 'VIDEO_FRAME';

export interface IEvidenceMetadata {
  mimeType: string;
  filename: string;
  localFilePath: string;
  storageKey?: string;
  size: number;
  sha256: string;
  captureTimestamp: Date;
  deviceMetadata?: Record<string, any>;
  qualityResult?: Record<string, any>;
  sourceEvidenceId?: Types.ObjectId;
  state: 'LOCAL' | 'UPLOADED' | 'SYNC_FAILED';
}

export interface IEvidence {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  type: EvidenceType;
  metadata: IEvidenceMetadata;
  syncMetadata: ISyncMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExtractedField {
  fieldName: string;
  rawText: string;
  normalizedValue?: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  barcodeReferenceValue?: string;
  hasConflict?: boolean;
}

export interface IOCRResult {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  evidenceId: Types.ObjectId;
  fields: IExtractedField[];
  modelVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBarcodeResult {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  evidenceId: Types.ObjectId;
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

export interface IVerificationResult {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
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

export interface IComplianceEvaluation {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  overallStatus: 'PASS' | 'FAIL' | 'REVIEW_NEEDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IRuleEvaluation {
  _id: Types.ObjectId;
  complianceEvaluationId: Types.ObjectId;
  ruleId: string;
  status: 'PASS' | 'FAIL' | 'N_A';
  evidenceIds: Types.ObjectId[];
}

export interface IViolation {
  _id: Types.ObjectId;
  complianceEvaluationId: Types.ObjectId;
  ruleEvaluationId: Types.ObjectId;
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

export interface IReviewableField {
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
  sourceEvidenceId?: Types.ObjectId | string;
  ruleReference?: string;
}

export interface IReviewableViolation {
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

export interface IFieldModificationRecord {
  fieldName: string;
  originalValue: string; // machineValue
  newValue: string;      // inspectorValue or empty/action label
  action: FieldReviewAction;
  reason?: string;
  timestamp: Date;
}

export interface IViolationDecisionRecord {
  violationId: string;
  ruleId: string;
  action: ViolationReviewAction;
  reason?: string;
  timestamp: Date;
}

export interface IInspectorDecision {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  inspectorId: string;
  decision: FinalDecisionState;
  reason: string;
  changedFields: IFieldModificationRecord[];
  violationDecisions?: IViolationDecisionRecord[];
  timestamp: Date;
  violationId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

