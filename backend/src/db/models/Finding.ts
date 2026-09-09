import mongoose, { Schema, Document, Types } from 'mongoose';

export type FindingResult = 'PASS' | 'POTENTIAL_VIOLATION' | 'INCONSISTENT' | 'INSUFFICIENT_EVIDENCE';

export interface IFinding extends Document {
  inspection: Types.ObjectId;
  rule: Types.ObjectId;
  ruleId: string;
  ruleVersion: string;
  relevantField?: string;
  result: FindingResult;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  extractedValue?: string;
  confidence?: number;
  supportingEvidence: Types.ObjectId[];
  reason?: string;
  verificationContext?: Record<string, any>;
  reviewStatus: 'PENDING' | 'REVIEWED';
  inspectorReview?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FindingSchema = new Schema(
  {
    inspection: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    rule: { type: Schema.Types.ObjectId, ref: 'Rule', required: true },
    ruleId: { type: String, required: true },
    ruleVersion: { type: String, required: true },
    relevantField: { type: String },
    result: { 
      type: String, 
      enum: ['PASS', 'POTENTIAL_VIOLATION', 'INCONSISTENT', 'INSUFFICIENT_EVIDENCE'], 
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
      required: true 
    },
    extractedValue: { type: String },
    confidence: { type: Number, min: 0, max: 100 },
    supportingEvidence: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
    reason: { type: String },
    verificationContext: { type: Schema.Types.Mixed },
    reviewStatus: { 
      type: String, 
      enum: ['PENDING', 'REVIEWED'], 
      default: 'PENDING' 
    },
    inspectorReview: { type: Schema.Types.ObjectId, ref: 'Review' }
  },
  { timestamps: true, strict: true }
);

// Indexes
FindingSchema.index({ inspection: 1, result: 1, createdAt: -1 });
FindingSchema.index({ ruleId: 1, ruleVersion: 1, result: 1 });

export const Finding = mongoose.model<IFinding>('Finding', FindingSchema);
