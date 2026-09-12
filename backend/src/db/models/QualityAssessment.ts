import mongoose, { Schema, Document, Types } from 'mongoose';

export type QualityAssessmentStatus = 'ACCEPT' | 'RECAPTURE' | 'REVIEW' | 'PROCESSING' | 'ERROR' | 'UNKNOWN';
export type QualityIssueSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IQualityIssue {
  code: string;
  category: string;
  severity: QualityIssueSeverity;
  message: string;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  blocking: boolean;
  recommendation?: string;
}

export interface IQualityAssessment extends Document {
  evidenceId: Types.ObjectId;
  inspectionId: Types.ObjectId;
  assessmentId: string;
  status: QualityAssessmentStatus;
  score: number;
  algorithmVersion: string;
  policyVersion: string;
  checks: Record<string, any>;
  issues: IQualityIssue[];
  diagnosticRegions: Record<string, any>[];
  recommendations: string[];
  processedAt: Date;
  processingDurationMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const QualityIssueSchema = new Schema({
  code: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
  message: { type: String, required: true },
  region: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  blocking: { type: Boolean, required: true },
  recommendation: { type: String }
}, { _id: false });

const QualityAssessmentSchema = new Schema(
  {
    evidenceId: { type: Schema.Types.ObjectId, ref: 'Evidence', required: true, index: true },
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    assessmentId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['ACCEPT', 'RECAPTURE', 'REVIEW', 'PROCESSING', 'ERROR', 'UNKNOWN'], required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    algorithmVersion: { type: String, required: true },
    policyVersion: { type: String, required: true },
    checks: { type: Schema.Types.Mixed, default: {} },
    issues: [QualityIssueSchema],
    diagnosticRegions: [{ type: Schema.Types.Mixed }],
    recommendations: [{ type: String }],
    processedAt: { type: Date, required: true },
    processingDurationMs: { type: Number, required: true }
  },
  { timestamps: true, strict: true }
);

export const QualityAssessment = mongoose.model<IQualityAssessment>('QualityAssessment', QualityAssessmentSchema);
