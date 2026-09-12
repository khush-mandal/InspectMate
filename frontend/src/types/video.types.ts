export type VideoProcessingStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type TargetField = 
  | 'MRP' 
  | 'NET_QUANTITY' 
  | 'MANUFACTURER' 
  | 'MANUFACTURER_ADDRESS' 
  | 'DATE' 
  | 'CONSUMER_CARE'
  | 'BARCODE'
  | 'FRONT_COVER'
  | 'NUTRITION_FACTS';

export type FrameSelectionStatus = 'SELECTED' | 'NO_USABLE_FRAME' | 'LOW_CONFIDENCE' | 'NOT_REQUESTED' | 'UNKNOWN';

export interface FieldRegion {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  confidence: number;
}

export interface FrameQualityInfo {
  sharpness: number;
  glare: number;
  exposure: number;
  textVisibility: number;
  overallQuality: number;
}

export interface FrameCandidate {
  frameId: string; // Unique ID for this candidate
  videoEvidenceId: string; // The ID of the parent video evidence
  frameNumber: number;
  timestampMs: number;
  localMediaId: string; // ID in MediaBlobStore
  localUri?: string; // transient preview URL
  width: number;
  height: number;
  quality: FrameQualityInfo;
  detectedRegions: Partial<Record<TargetField, FieldRegion>>; // Mocked or detected regions
  selectionStatus: 'NOT_SELECTED' | 'SELECTED' | 'REJECTED';
}

export interface FieldScore {
  score: number; // 0-100
  reason: string;
  regionQuality?: {
    sharpness: number;
    glareOverlap: boolean;
    textSizeAdequate: boolean;
  };
}

export interface BestFrameResult {
  bestFrameId: string; // ID of the FrameCandidate
  evidenceId?: string; // ID of the generated LocalEvidenceRecord
  frameNumber: number;
  timestampMs: number;
  score: number;
  reason: string;
  alternatives: string[]; // array of frameIds
}

export interface VideoProcessingJob {
  jobId: string;
  videoId: string; // clientEvidenceId of the video
  inspectionId: string;
  status: VideoProcessingStatus;
  processingVersion: string;
  requestedFields: TargetField[];
  
  requestedAt: number;
  startedAt?: number;
  completedAt?: number;
  
  durationMs?: number;
  frameCount: number;
  sampledFrameCount: number;
  selectedFrameCount: number;
  
  error?: string;
  
  fieldResults: Partial<Record<TargetField, BestFrameResult | { status: 'NO_USABLE_FRAME', reason: string }>>;
  
  coverageStatus: 'FULL' | 'PARTIAL' | 'NONE';
}
