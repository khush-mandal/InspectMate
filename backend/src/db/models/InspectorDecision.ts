import mongoose, { Schema, Document } from 'mongoose';
import { IInspectorDecision } from '../../interfaces/domain.interfaces';

export interface IInspectorDecisionDocument extends IInspectorDecision, Document {
  _id: mongoose.Types.ObjectId;
}

const InspectorDecisionSchema = new Schema(
  {
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    violationId: { type: Schema.Types.ObjectId, ref: 'Violation' },
    decision: { 
      type: String, 
      enum: ['VERIFIED_VIOLATION', 'DISMISSED', 'REQUEST_MORE_EVIDENCE'], 
      required: true 
    },
    notes: { type: String, maxlength: 2000 }
  },
  { timestamps: true, strict: true }
);

InspectorDecisionSchema.index({ inspectionId: 1, createdAt: -1 });

export const InspectorDecision = mongoose.model<IInspectorDecisionDocument>('InspectorDecision', InspectorDecisionSchema);
