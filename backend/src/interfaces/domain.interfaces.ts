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

export interface IInspectorDecision {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  violationId?: Types.ObjectId;
  decision: 'VERIFIED_VIOLATION' | 'DISMISSED' | 'REQUEST_MORE_EVIDENCE';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
