import mongoose, { Schema, Document } from 'mongoose';
import { IRuleEvaluation } from '../../interfaces/domain.interfaces';

export interface IRuleEvaluationDocument extends IRuleEvaluation, Document {
  _id: mongoose.Types.ObjectId;
}

const RuleEvaluationSchema = new Schema(
  {
    complianceEvaluationId: { type: Schema.Types.ObjectId, ref: 'ComplianceEvaluation', required: true, index: true },
    ruleId: { type: String, required: true },
    status: { type: String, enum: ['PASS', 'FAIL', 'N_A'], required: true },
    evidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }]
  },
  { timestamps: true, strict: true }
);

RuleEvaluationSchema.index({ complianceEvaluationId: 1, status: 1 });

export const RuleEvaluation = mongoose.model<IRuleEvaluationDocument>('RuleEvaluation', RuleEvaluationSchema);
