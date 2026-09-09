import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReportStatus = 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface IReport extends Document {
  inspection: Types.ObjectId;
  reportVersion: number;
  storageProvider?: string;
  storageKey?: string;
  fileHash?: string;
  mimeType?: string;
  fileSize?: number;
  generatedBy: Types.ObjectId;
  generatedAt?: Date;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema(
  {
    inspection: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    reportVersion: { type: Number, required: true, default: 1 },
    storageProvider: { type: String },
    storageKey: { type: String },
    fileHash: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number, min: 0 },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    generatedAt: { type: Date },
    status: { 
      type: String, 
      enum: ['GENERATING', 'COMPLETED', 'FAILED'], 
      default: 'GENERATING',
      required: true 
    }
  },
  { timestamps: true, strict: true }
);

// Indexes
ReportSchema.index({ inspection: 1, reportVersion: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
