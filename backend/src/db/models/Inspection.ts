import mongoose, { Schema, Document, Types } from 'mongoose';

export type LifecycleStatus = 'DRAFT' | 'PROCESSING' | 'AWAITING_REVIEW' | 'COMPLETED' | 'ARCHIVED';
export type FinalResultStatus = 'VERIFIED' | 'POTENTIAL_VIOLATION' | 'INCONSISTENT' | 'INSUFFICIENT_EVIDENCE' | 'PENDING';

export interface IInspection extends Document {
  inspector: Types.ObjectId;
  clientReference?: string;
  lifecycleStatus: LifecycleStatus;
  finalStatus?: FinalResultStatus;
  product?: Types.ObjectId;
  productSnapshot?: Record<string, any>;
  productCategory?: string;
  manufacturer?: string;
  manufacturerNormalized?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  notes?: string;
  evidenceCount: number;
  extractionRun?: Types.ObjectId;
  verificationRun?: Types.ObjectId;
  findingCount: number;
  report?: Types.ObjectId;
  completedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InspectionSchema = new Schema(
  {
    inspector: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientReference: { 
      type: String, 
      sparse: true, 
      unique: true,
      index: true
    },
    lifecycleStatus: { 
      type: String, 
      enum: ['DRAFT', 'PROCESSING', 'AWAITING_REVIEW', 'COMPLETED', 'ARCHIVED'], 
      default: 'DRAFT',
      required: true
    },
    finalStatus: { 
      type: String, 
      enum: ['VERIFIED', 'POTENTIAL_VIOLATION', 'INCONSISTENT', 'INSUFFICIENT_EVIDENCE', 'PENDING'],
      default: 'PENDING'
    },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    productSnapshot: { type: Schema.Types.Mixed },
    productCategory: { type: String, index: true },
    manufacturer: { type: String },
    manufacturerNormalized: { type: String, index: true },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }
    },
    notes: { type: String, maxlength: 2000 },
    evidenceCount: { type: Number, default: 0, min: 0 },
    extractionRun: { type: Schema.Types.ObjectId, ref: 'ExtractionRun' },
    verificationRun: { type: Schema.Types.ObjectId, ref: 'VerificationRun' },
    findingCount: { type: Number, default: 0, min: 0 },
    report: { type: Schema.Types.ObjectId, ref: 'Report' },
    completedAt: { type: Date },
    archivedAt: { type: Date }
  },
  { 
    timestamps: true,
    strict: true 
  }
);

// Indexes
InspectionSchema.index({ inspector: 1, createdAt: -1 });
InspectionSchema.index({ lifecycleStatus: 1, createdAt: -1 });
InspectionSchema.index({ finalStatus: 1, createdAt: -1 });
InspectionSchema.index({ productCategory: 1, createdAt: -1 });
InspectionSchema.index({ manufacturerNormalized: 1, createdAt: -1 });
InspectionSchema.index({ location: '2dsphere' });

export const Inspection = mongoose.model<IInspection>('Inspection', InspectionSchema);
