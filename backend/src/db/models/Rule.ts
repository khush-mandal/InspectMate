import mongoose, { Schema, Document, Types } from 'mongoose';

export type RuleStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUPERSEDED';

export interface IRule extends Document {
  ruleId: string;
  version: string;
  name: string;
  description?: string;
  category: string;
  field: string;
  operator: string;
  parameters?: Record<string, any>;
  applicability?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: RuleStatus;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  supersededBy?: Types.ObjectId;
  authoritativeSource?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema(
  {
    ruleId: { type: String, required: true, index: true },
    version: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true, index: true },
    field: { type: String, required: true },
    operator: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed },
    applicability: { type: Schema.Types.Mixed },
    severity: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'SUPERSEDED'], 
      required: true,
      index: true
    },
    effectiveFrom: { type: Date, index: true },
    effectiveTo: { type: Date, index: true },
    supersededBy: { type: Schema.Types.ObjectId, ref: 'Rule' },
    authoritativeSource: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, strict: true }
);

// Compound unique index for ruleId + version
RuleSchema.index({ ruleId: 1, version: 1 }, { unique: true });

export const Rule = mongoose.model<IRule>('Rule', RuleSchema);
