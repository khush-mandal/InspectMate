import mongoose, { Schema, Document, Types } from 'mongoose';
import { FindingResult } from './Finding';

export type ReviewAction = 'VERIFY' | 'REJECT' | 'REQUEST_MORE_EVIDENCE' | 'ADD_NOTE';

export interface IReview extends Document {
  inspector: Types.ObjectId;
  inspection: Types.ObjectId;
  finding: Types.ObjectId;
  previousState?: FindingResult;
  finalState?: FindingResult;
  action: ReviewAction;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema(
  {
    inspector: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inspection: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true },
    finding: { type: Schema.Types.ObjectId, ref: 'Finding', required: true },
    previousState: { 
      type: String, 
      enum: ['PASS', 'POTENTIAL_VIOLATION', 'INCONSISTENT', 'INSUFFICIENT_EVIDENCE'] 
    },
    finalState: { 
      type: String, 
      enum: ['PASS', 'POTENTIAL_VIOLATION', 'INCONSISTENT', 'INSUFFICIENT_EVIDENCE'] 
    },
    action: { 
      type: String, 
      enum: ['VERIFY', 'REJECT', 'REQUEST_MORE_EVIDENCE', 'ADD_NOTE'], 
      required: true 
    },
    note: { type: String, maxlength: 2000 }
  },
  { timestamps: true, strict: true }
);

// Indexes
ReviewSchema.index({ inspection: 1, createdAt: -1 });
ReviewSchema.index({ finding: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
