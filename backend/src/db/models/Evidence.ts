import mongoose, { Schema, Document, Types } from 'mongoose';

export type EvidenceType = 'PHOTO' | 'VIDEO' | 'BEST_FRAME' | 'CROP';
export type CaptureSide = 'FRONT' | 'BACK' | 'SIDE' | 'TOP' | 'BOTTOM' | 'UNKNOWN';
export type QualityAssessment = 'PENDING' | 'ACCEPT' | 'RECAPTURE' | 'REVIEW';

export interface IEvidence extends Document {
  inspection: Types.ObjectId;
  evidenceType: EvidenceType;
  captureSide: CaptureSide;
  sourceEvidence?: Types.ObjectId;
  frameNumber?: number;
  storageProvider: string;
  storageBucket?: string;
  storageKey: string;
  storageVersion?: string;
  sha256Hash: string;
  mimeType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  videoDuration?: number;
  capturedAt: Date;
  uploadedAt: Date;
  qualityAssessment: QualityAssessment;
  qualityInformation?: {
    score?: number;
    blurState?: string;
    glareState?: string;
    resolutionState?: string;
    perspectiveState?: string;
    textVisibilityState?: string;
    coverageState?: string;
    issues?: string[];
    evaluatedAt?: Date;
  };
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
  boundingInformation?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema(
  {
    inspection: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    evidenceType: { type: String, enum: ['PHOTO', 'VIDEO', 'BEST_FRAME', 'CROP'], required: true },
    captureSide: { type: String, enum: ['FRONT', 'BACK', 'SIDE', 'TOP', 'BOTTOM', 'UNKNOWN'], default: 'UNKNOWN' },
    sourceEvidence: { type: Schema.Types.ObjectId, ref: 'Evidence' },
    frameNumber: { type: Number, min: 0 },
    storageProvider: { type: String, required: true },
    storageBucket: { type: String },
    storageKey: { type: String, required: true },
    storageVersion: { type: String },
    sha256Hash: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    dimensions: {
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    videoDuration: { type: Number, min: 0 },
    capturedAt: { type: Date, required: true },
    uploadedAt: { type: Date, required: true },
    qualityAssessment: { type: String, enum: ['PENDING', 'ACCEPT', 'RECAPTURE', 'REVIEW'], default: 'PENDING' },
    qualityInformation: {
      score: { type: Number, min: 0, max: 100 },
      blurState: { type: String },
      glareState: { type: String },
      resolutionState: { type: String },
      perspectiveState: { type: String },
      textVisibilityState: { type: String },
      coverageState: { type: String },
      issues: [{ type: String }],
      evaluatedAt: { type: Date }
    },
    frameMetadata: {
      parentVideoEvidenceId: { type: String },
      frameNumber: { type: Number },
      timestampMs: { type: Number },
      targetField: { type: String },
      selectionScore: { type: Number },
      selectionReason: { type: String },
      algorithmVersion: { type: String },
      policyVersion: { type: String }
    },
    boundingInformation: { type: Schema.Types.Mixed }
  },
  { timestamps: true, strict: true }
);

// Indexes
EvidenceSchema.index({ inspection: 1, capturedAt: -1 });
EvidenceSchema.index({ inspection: 1, evidenceType: 1 });
EvidenceSchema.index({ sha256Hash: 1 });

export const Evidence = mongoose.model<IEvidence>('Evidence', EvidenceSchema);
