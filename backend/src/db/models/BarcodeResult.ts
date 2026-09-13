import mongoose, { Schema, Document } from 'mongoose';
import { IBarcodeResult } from '../../interfaces/domain.interfaces';

export interface IBarcodeResultDocument extends IBarcodeResult, Document {
  _id: mongoose.Types.ObjectId;
}

const BarcodeResultSchema = new Schema(
  {
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    evidenceId: { type: Schema.Types.ObjectId, ref: 'Evidence', required: true },
    format: { type: String, required: true },
    rawValue: { type: String, required: true },
    decodedData: { type: Schema.Types.Mixed }
  },
  { timestamps: true, strict: true }
);

BarcodeResultSchema.index({ inspectionId: 1 });
BarcodeResultSchema.index({ evidenceId: 1 });

export const BarcodeResult = mongoose.model<IBarcodeResultDocument>('BarcodeResult', BarcodeResultSchema);
