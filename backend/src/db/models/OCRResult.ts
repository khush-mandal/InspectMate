import mongoose, { Schema, Document } from 'mongoose';
import { IOCRResult } from '../../interfaces/domain.interfaces';

export interface IOCRResultDocument extends IOCRResult, Document {
  _id: mongoose.Types.ObjectId;
}

const ExtractedFieldSchema = new Schema({
  fieldName: { type: String, required: true },
  value: { type: String, required: true },
  normalizedValue: { type: String },
  confidence: { type: Number, min: 0, max: 100 },
  sourceEvidenceId: { type: String, required: true },
  boundingBox: {
    x: { type: Number, min: 0 },
    y: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  extractionMethod: { type: String, required: true },
  needsVerification: { type: Boolean, required: true, default: false }
}, { _id: false });

const OCRResultSchema = new Schema(
  {
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    evidenceId: { type: Schema.Types.ObjectId, ref: 'Evidence', required: true },
    fields: [ExtractedFieldSchema],
    modelVersion: { type: String, required: true }
  },
  { timestamps: true, strict: true }
);

OCRResultSchema.index({ evidenceId: 1 });

export const OCRResult = mongoose.model<IOCRResultDocument>('OCRResult', OCRResultSchema);
