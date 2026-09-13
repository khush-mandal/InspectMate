import mongoose, { Schema, Document } from 'mongoose';
import { IComplianceEvaluation } from '../../interfaces/domain.interfaces';

export interface IComplianceEvaluationDocument extends IComplianceEvaluation, Document {
  _id: mongoose.Types.ObjectId;
}

const ComplianceEvaluationSchema = new Schema(
  {
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    overallStatus: { 
      type: String, 
      enum: ['PASS', 'FAIL', 'REVIEW_NEEDED'], 
      required: true 
    }
  },
  { timestamps: true, strict: true }
);

export const ComplianceEvaluation = mongoose.model<IComplianceEvaluationDocument>('ComplianceEvaluation', ComplianceEvaluationSchema);
