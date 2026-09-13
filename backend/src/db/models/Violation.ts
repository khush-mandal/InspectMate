import mongoose, { Schema, Document } from 'mongoose';
import { IViolation } from '../../interfaces/domain.interfaces';

export interface IViolationDocument extends IViolation, Document {
  _id: mongoose.Types.ObjectId;
}

const ViolationSchema = new Schema(
  {
    complianceEvaluationId: { type: Schema.Types.ObjectId, ref: 'ComplianceEvaluation', required: true, index: true },
    ruleEvaluationId: { type: Schema.Types.ObjectId, ref: 'RuleEvaluation', required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
    description: { type: String, required: true }
  },
  { timestamps: true, strict: true }
);

ViolationSchema.index({ complianceEvaluationId: 1, severity: 1 });

export const Violation = mongoose.model<IViolationDocument>('Violation', ViolationSchema);
