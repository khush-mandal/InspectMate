import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExtractionField {
  fieldName: string;
  rawText?: string;
  normalizedValue?: string;
  unit?: string;
  confidence?: number;
  sourceEvidence?: Types.ObjectId;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fieldStatus: 'SUCCESS' | 'WARNING' | 'ERROR';
  provider?: string;
  modelVersion?: string;
}

export interface IExtractionRun extends Document {
  inspection: Types.ObjectId;
  inputEvidenceIds: Types.ObjectId[];
  processingStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  provider: string;
  model: string;
  modelVersion: string;
  extractionFields: IExtractionField[];
  overallConfidence?: number;
  warnings?: string[];
  errorInformation?: Record<string, any>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExtractionFieldSchema = new Schema({
  fieldName: { type: String, required: true },
  rawText: { type: String },
  normalizedValue: { type: String },
  unit: { type: String },
  confidence: { type: Number, min: 0, max: 100 },
  sourceEvidence: { type: Schema.Types.ObjectId, ref: 'Evidence' },
  boundingBox: {
    x: { type: Number, min: 0 },
    y: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  fieldStatus: { type: String, enum: ['SUCCESS', 'WARNING', 'ERROR'], required: true },
  provider: { type: String },
  modelVersion: { type: String }
}, { _id: false });

const ExtractionRunSchema = new Schema(
  {
    inspection: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    inputEvidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
    processingStatus: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], required: true, default: 'PENDING' },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    modelVersion: { type: String, required: true },
    extractionFields: [ExtractionFieldSchema],
    overallConfidence: { type: Number, min: 0, max: 100 },
    warnings: [{ type: String }],
    errorInformation: { type: Schema.Types.Mixed },
    startedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true, strict: true }
);

export const ExtractionRun = mongoose.model<IExtractionRun>('ExtractionRun', ExtractionRunSchema);
