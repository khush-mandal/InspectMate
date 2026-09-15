import mongoose, { Schema, Document } from 'mongoose';
import { IInspectorDecision } from '../../interfaces/domain.interfaces';

export interface IInspectorDecisionDocument extends IInspectorDecision, Document {
  _id: mongoose.Types.ObjectId;
}

const FieldModificationSchema = new Schema({
  fieldName: { type: String, required: true },
  originalValue: { type: String, required: true },
  newValue: { type: String, default: '' },
  action: { 
    type: String, 
    enum: ['ACCEPT', 'EDIT', 'MARK_UNREADABLE', 'REQUEST_RECAPTURE'], 
    required: true 
  },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ViolationDecisionRecordSchema = new Schema({
  violationId: { type: String, required: true },
  ruleId: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['CONFIRM', 'REJECT', 'REQUEST_ADDITIONAL_EVIDENCE'], 
    required: true 
  },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const InspectorDecisionSchema = new Schema(
  {
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    inspectorId: { type: String, required: true, index: true },
    decision: { 
      type: String, 
      enum: [
        'DRAFT', 
        'UNDER_REVIEW', 
        'REQUIRES_EVIDENCE', 
        'COMPLIANT', 
        'NON_COMPLIANT', 
        'INCONCLUSIVE', 
        'CLOSED',
        // Backwards compatibility with previous schema
        'VERIFIED_VIOLATION', 
        'DISMISSED', 
        'REQUEST_MORE_EVIDENCE'
      ], 
      required: true 
    },
    reason: { type: String, required: true, maxlength: 4000 },
    changedFields: { type: [FieldModificationSchema], default: [] },
    violationDecisions: { type: [ViolationDecisionRecordSchema], default: [] },
    timestamp: { type: Date, default: Date.now, required: true },
    violationId: { type: Schema.Types.ObjectId, ref: 'Violation' },
    notes: { type: String, maxlength: 2000 }
  },
  { timestamps: true, strict: true }
);

InspectorDecisionSchema.index({ inspectionId: 1, createdAt: -1 });
InspectorDecisionSchema.index({ inspectorId: 1, createdAt: -1 });

export const InspectorDecision = mongoose.model<IInspectorDecisionDocument>('InspectorDecision', InspectorDecisionSchema);

