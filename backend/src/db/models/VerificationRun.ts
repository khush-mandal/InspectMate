import mongoose, { Schema, Document, Types } from 'mongoose';

export type ComparisonOutcome = 'CONSISTENT' | 'INCONSISTENT' | 'UNKNOWN';

export interface IFieldComparison {
  field: string;
  labelValue?: string;
  referenceValue?: string;
  outcome: ComparisonOutcome;
  reason?: string;
  confidence?: number;
}

export interface IVerificationRun extends Document {
  inspection: Types.ObjectId;
  barcodeData?: string;
  gtin?: string;
  barcodeAttributes?: Record<string, any>;
  trustedDataSnapshot?: Record<string, any>;
  comparisons: IFieldComparison[];
  overallStatus: ComparisonOutcome;
  warnings?: string[];
  processingMetadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const FieldComparisonSchema = new Schema({
  field: { type: String, required: true },
  labelValue: { type: String },
  referenceValue: { type: String },
  outcome: { type: String, enum: ['CONSISTENT', 'INCONSISTENT', 'UNKNOWN'], required: true },
  reason: { type: String },
  confidence: { type: Number, min: 0, max: 100 }
}, { _id: false });

const VerificationRunSchema = new Schema(
  {
    inspection: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    barcodeData: { type: String },
    gtin: { type: String, index: true },
    barcodeAttributes: { type: Schema.Types.Mixed },
    trustedDataSnapshot: { type: Schema.Types.Mixed },
    comparisons: [FieldComparisonSchema],
    overallStatus: { type: String, enum: ['CONSISTENT', 'INCONSISTENT', 'UNKNOWN'], required: true },
    warnings: [{ type: String }],
    processingMetadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true, strict: true }
);

export const VerificationRun = mongoose.model<IVerificationRun>('VerificationRun', VerificationRunSchema);
