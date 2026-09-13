import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISyncIdempotency extends Document {
  idempotencyKey: string;
  evidenceId: Types.ObjectId;
  inspectionId: Types.ObjectId;
  responsePayload: Record<string, any>;
  createdAt: Date;
}

const SyncIdempotencySchema = new Schema(
  {
    idempotencyKey: {
      type: String,
      required: true
    },
    evidenceId: {
      type: Schema.Types.ObjectId,
      ref: 'Evidence',
      required: true
    },
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true
    },
    responsePayload: {
      type: Schema.Types.Mixed,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7776000 // 90 days TTL
    }
  },
  { timestamps: false, strict: true }
);

// Indexes
SyncIdempotencySchema.index({ idempotencyKey: 1 }, { unique: true });
SyncIdempotencySchema.index({ inspectionId: 1 });

export const SyncIdempotency = mongoose.model<ISyncIdempotency>('SyncIdempotency', SyncIdempotencySchema);
