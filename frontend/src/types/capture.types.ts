export type CaptureSlotId = 'FRONT' | 'BACK' | 'SIDE';

export type CaptureMode = 'PHOTO' | 'VIDEO' | 'BARCODE' | 'QR' | 'GALLERY';

export type CaptureStatus = 
  | 'NOT_CAPTURED'
  | 'CAPTURING'
  | 'VALIDATING'
  | 'CAPTURED'
  | 'INVALID'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'SYNC_PENDING'
  | 'SYNC_FAILED';

export type SyncStatus = 
  | 'LOCAL_ONLY' 
  | 'SYNC_PENDING' 
  | 'SYNCING' 
  | 'SYNCED' 
  | 'SYNC_FAILED';

export type SyncJobStatus = 
  | 'QUEUED' 
  | 'READY' 
  | 'PROCESSING' 
  | 'SUCCEEDED' 
  | 'FAILED' 
  | 'CANCELLED';

export type SyncOperation = 
  | 'UPLOAD_EVIDENCE' 
  | 'SYNC_INSPECTION';

export type SyncErrorCategory = 
  | 'RETRYABLE'
  | 'NON_RETRYABLE'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'SERVER'
  | 'STORAGE'
  | 'FILE_NOT_FOUND'
  | 'INTEGRITY_FAILURE'
  | 'UNKNOWN';

export interface CaptureRequirement {
  id: CaptureSlotId;
  label: string;
  description: string;
  required: boolean;
}

export type ValidationErrorCode = 
  | 'FILE_NOT_FOUND'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'LOW_RESOLUTION'
  | 'FILE_TOO_LARGE'
  | 'CORRUPTED_MEDIA'
  | 'INVALID_DURATION'
  | 'INVALID_BARCODE'
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'MICROPHONE_UNAVAILABLE'
  | 'STORAGE_UNAVAILABLE'
  | 'UNKNOWN';

export interface ValidationResult {
  status: 'VALID' | 'INVALID';
  reasons?: Array<{
    code: ValidationErrorCode;
    message: string;
  }>;
}

export interface LocalEvidenceRecord {
  id: string; // local primary key (UUID)
  clientEvidenceId: string;
  inspectionId: string;
  slotId: CaptureSlotId;
  mode: CaptureMode;
  localMediaId: string; // key in MediaBlobStore
  localUri?: string; // transient preview object URL in runtime memory
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  durationMs?: number;
  sha256: string;
  capturedAt: number; // UTC timestamp of capture
  localCreatedAt: number; // UTC timestamp of local persistence
  serverEvidenceId?: string;
  serverUploadedAt?: string;
  syncStatus: SyncStatus;
  uploadAttempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  lastErrorCategory?: SyncErrorCategory;
  supersedesClientEvidenceId?: string;
  isActive: boolean;
  userId: string;
  validationResult: ValidationResult;
  qualityAssessment?: QualityAssessment;
  frameMetadata?: {
    parentVideoEvidenceId: string;
    frameNumber: number;
    timestampMs: number;
    targetField: string;
    selectionScore: number;
    selectionReason: string;
    algorithmVersion: string;
    policyVersion: string;
  };
}

// Backward-compatibility alias for UI consumption
export type EvidenceItem = LocalEvidenceRecord;

export interface SyncJob {
  jobId: string;
  entityType: 'EVIDENCE' | 'INSPECTION';
  entityId: string; // clientEvidenceId or inspectionId
  operation: SyncOperation;
  inspectionId: string;
  clientRequestId: string;
  priority: number; // 100 for inspection creation, 80 for required evidence, 50 for optional
  attemptCount: number;
  status: SyncJobStatus;
  createdAt: number;
  updatedAt: number;
  nextAttemptAt: number;
  lockedAt?: number;
  lockedBy?: string;
  lastError?: {
    category: SyncErrorCategory;
    code: string;
    message: string;
    retryable: boolean;
    timestamp: number;
  };
  dedupeKey: string;
  userId: string;
}

export interface SyncEvent {
  id?: number;
  timestamp: number;
  entityType: 'EVIDENCE' | 'INSPECTION';
  entityId: string;
  inspectionId: string;
  eventType: 
    | 'CAPTURED' 
    | 'VALIDATED' 
    | 'PERSISTED' 
    | 'QUEUED' 
    | 'SYNC_STARTED' 
    | 'SYNC_SUCCEEDED' 
    | 'SYNC_FAILED' 
    | 'RETRY_SCHEDULED' 
    | 'SUPERSEDED';
  details?: Record<string, any>;
  userId: string;
}

export interface SyncSummary {
  total: number;
  synced: number;
  pending: number;
  syncing: number;
  failed: number;
  localOnly: number;
  isFullySynced: boolean;
}

export interface BarcodeResult {
  rawValue: string;
  symbology: string;
  capturedAt: number;
}

export type QualityAssessmentStatus = 'ACCEPT' | 'RECAPTURE' | 'REVIEW' | 'PROCESSING' | 'ERROR' | 'UNKNOWN';

export type QualityIssueSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface QualityRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QualityIssue {
  code: string;
  category: string;
  severity: QualityIssueSeverity;
  message: string;
  region?: QualityRegion;
  blocking: boolean;
  recommendation?: string;
}

export interface QualityAssessment {
  assessmentId: string;
  status: QualityAssessmentStatus;
  score: number;
  algorithmVersion: string;
  policyVersion: string;
  checks: Record<string, any>;
  issues: QualityIssue[];
  diagnosticRegions: QualityRegion[];
  recommendations: string[];
  processedAt: number;
  processingDurationMs: number;
}
