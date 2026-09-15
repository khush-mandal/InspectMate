import mongoose, { Schema, Document, Types } from 'mongoose';
import { 
  IInspection as ICanonicalInspection, 
  InspectionStatus, 
  FinalDecisionState,
  IReviewableField,
  IReviewableViolation 
} from '../../interfaces/domain.interfaces';

export type LifecycleStatus = 'DRAFT' | 'PROCESSING' | 'AWAITING_REVIEW' | 'COMPLETED' | 'ARCHIVED';
export type FinalResultStatus = 'VERIFIED' | 'POTENTIAL_VIOLATION' | 'INCONSISTENT' | 'INSUFFICIENT_EVIDENCE' | 'PENDING';

export interface IInspection extends Document, Partial<Omit<ICanonicalInspection, '_id'>> {
  inspector: Types.ObjectId;
  clientReference?: string;
  lifecycleStatus: LifecycleStatus;
  finalStatus?: FinalResultStatus;
  decisionState?: FinalDecisionState;
  adjudicatedAt?: Date;
  adjudicatedBy?: Types.ObjectId;
  adjudicationReason?: string;
  fieldReviews?: IReviewableField[];
  violationReviews?: IReviewableViolation[];
  additionalEvidence?: Types.ObjectId[];
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
    // Canonical Phase 8 Fields
    inspectorId: { type: String, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package' },
    status: { 
      type: String, 
      enum: ['DRAFT', 'EVIDENCE_CAPTURE', 'EXTRACTION', 'COMPLIANCE_PENDING', 'REVIEW_REQUIRED', 'COMPLETED', 'SYNC_PENDING', 'SYNCED', 'SYNC_FAILED'], 
    },
    syncMetadata: { type: Schema.Types.Mixed },
    finalStatus: { 
      type: String, 
      enum: ['VERIFIED', 'POTENTIAL_VIOLATION', 'INCONSISTENT', 'INSUFFICIENT_EVIDENCE', 'PENDING'],
      default: 'PENDING'
    },
    decisionState: {
      type: String,
      enum: ['DRAFT', 'UNDER_REVIEW', 'REQUIRES_EVIDENCE', 'COMPLIANT', 'NON_COMPLIANT', 'INCONCLUSIVE', 'CLOSED'],
      default: 'DRAFT',
      index: true
    },
    adjudicatedAt: { type: Date },
    adjudicatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    adjudicationReason: { type: String, maxlength: 4000 },
    fieldReviews: [{
      fieldId: { type: String, required: true },
      fieldName: { type: String, required: true },
      machineValue: { type: String, required: true },
      inspectorValue: { type: String },
      confidence: { type: Number, default: 0 },
      status: { 
        type: String, 
        enum: ['PENDING', 'ACCEPTED', 'EDITED', 'UNREADABLE', 'RECAPTURE_REQUESTED'],
        default: 'PENDING' 
      },
      notes: { type: String },
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      sourceAngle: { type: String },
      sourceEvidenceId: { type: Schema.Types.Mixed },
      ruleReference: { type: String }
    }],
    violationReviews: [{
      violationId: { type: String, required: true },
      ruleId: { type: String, required: true },
      ruleName: { type: String, required: true },
      regulationReference: { type: String, required: true },
      severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
      description: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'REQUIRES_EVIDENCE'],
        default: 'PENDING' 
      },
      overrideReason: { type: String },
      affectedFields: [{ type: String }],
      evidenceIds: [{ type: String }]
    }],
    additionalEvidence: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
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
