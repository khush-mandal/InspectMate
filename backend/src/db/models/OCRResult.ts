import mongoose, { Schema, Document } from 'mongoose';
import { IOCRResult } from '../../interfaces/domain.interfaces';

export interface IOCRResultDocument extends IOCRResult, Document {
  _id: mongoose.Types.ObjectId;
}

const ExtractedFieldSchema = new Schema({
  fieldName: { type: String, required: true },
  rawText: { type: String, required: true },
  normalizedValue: { type: String },
  confidence: { type: Number, min: 0, max: 100 },
  boundingBox: {
    x: { type: Number, min: 0 },
    y: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  }
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

OCRResultSchema.index({ inspectionId: 1 });
OCRResultSchema.index({ evidenceId: 1 });

export const OCRResult = mongoose.model<IOCRResultDocument>('OCRResult', OCRResultSchema);
