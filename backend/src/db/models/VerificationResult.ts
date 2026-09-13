import mongoose, { Schema, Document } from 'mongoose';
import { IVerificationResult } from '../../interfaces/domain.interfaces';

export interface IVerificationResultDocument extends IVerificationResult, Document {
  _id: mongoose.Types.ObjectId;
}

const FieldComparisonSchema = new Schema({
  field: { type: String, required: true },
  extractedValue: { type: String },
  referenceValue: { type: String },
  isMatch: { type: Boolean, required: true }
}, { _id: false });

const VerificationResultSchema = new Schema(
  {
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    fieldComparisons: [FieldComparisonSchema],
    overallMatch: { type: Boolean, required: true }
  },
  { timestamps: true, strict: true }
);

export const VerificationResult = mongoose.model<IVerificationResultDocument>('VerificationResult', VerificationResultSchema);
