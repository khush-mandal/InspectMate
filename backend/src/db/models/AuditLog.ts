import mongoose, { Schema, Document, Types } from 'mongoose';

export type ActorType = 'USER' | 'SYSTEM';

export interface IAuditChange {
  field: string;
  oldValue?: any;
  newValue?: any;
}

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  actorType: ActorType;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  inspection?: Types.ObjectId;
  changes?: IAuditChange[];
  metadata?: Record<string, any>;
  requestId?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditChangeSchema = new Schema({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed }
}, { _id: false });

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, refPath: 'actorType' },
    actorType: { type: String, enum: ['USER', 'SYSTEM'], required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    inspection: { type: Schema.Types.ObjectId, ref: 'Inspection' },
    changes: [AuditChangeSchema],
    metadata: { type: Schema.Types.Mixed },
    requestId: { type: String },
    source: { type: String }
  },
  { timestamps: true, strict: true }
);

// Indexes
AuditLogSchema.index({ inspection: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

// Prevent standard deletions to enforce append-only
AuditLogSchema.pre('deleteOne', function(next) {
  next(new Error('Audit logs cannot be deleted'));
});
AuditLogSchema.pre('deleteMany', function(next) {
  next(new Error('Audit logs cannot be deleted'));
});
AuditLogSchema.pre('findOneAndDelete', function(next) {
  next(new Error('Audit logs cannot be deleted'));
});
AuditLogSchema.pre('findOneAndRemove', function(next) {
  next(new Error('Audit logs cannot be deleted'));
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
