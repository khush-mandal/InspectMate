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

export interface EvidenceItem {
  evidenceId: string;
  inspectionId: string;
  slotId: CaptureSlotId;
  mode: CaptureMode;
  localUri: string; // Object URL or file reference
  file?: File; // Store the actual file in memory temporarily (since it's a web app and we need it for upload)
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  capturedAt: number; // timestamp
  validationResult: ValidationResult;
  syncStatus: 'LOCAL_ONLY' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED';
  serverEvidenceId?: string;
}

export interface BarcodeResult {
  rawValue: string;
  symbology: string;
  capturedAt: number;
}
