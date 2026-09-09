import { Types } from 'mongoose';
import { inspectionRepository } from '../db/repositories/InspectionRepository';
import { auditLogRepository } from '../db/repositories/AuditLogRepository';
import { IInspection, LifecycleStatus, FinalResultStatus } from '../db/models/Inspection';
import { withTransaction } from '../db/transaction';
import { logger } from '../utils/logger';

export class InspectionService {
  async createInspection(data: {
    inspectorId: string;
    clientReference?: string;
    productCategory?: string;
    manufacturer?: string;
    location?: { type: 'Point'; coordinates: [number, number] };
    notes?: string;
  }): Promise<IInspection> {
    if (data.clientReference) {
      const existing = await inspectionRepository.findByClientReference(data.clientReference, false);
      if (existing) {
        logger.info(`Idempotent creation: Returning existing inspection for reference ${data.clientReference}`);
        return existing;
      }
    }

    return await withTransaction(async (session) => {
      const inspectionData: Partial<IInspection> = {
        inspector: new Types.ObjectId(data.inspectorId),
        clientReference: data.clientReference,
        lifecycleStatus: 'DRAFT',
        finalStatus: 'PENDING',
        productCategory: data.productCategory,
        manufacturer: data.manufacturer,
        manufacturerNormalized: data.manufacturer?.toLowerCase().trim(),
        location: data.location,
        notes: data.notes
      };

      const inspection = await inspectionRepository.create(inspectionData, session);

      await auditLogRepository.create({
        actorId: new Types.ObjectId(data.inspectorId),
        actorType: 'USER',
        action: 'INSPECTION_CREATED',
        entityType: 'Inspection',
        entityId: inspection._id as Types.ObjectId,
        inspection: inspection._id as Types.ObjectId,
        changes: [],
        source: 'API'
      }, session);

      return inspection;
    });
  }

  async transitionStatus(
    inspectionId: string, 
    newStatus: LifecycleStatus, 
    actorId: string,
    finalStatus?: FinalResultStatus
  ): Promise<IInspection | null> {
    return await withTransaction(async (session) => {
      const inspection = await inspectionRepository.findById(inspectionId, false);
      if (!inspection) throw new Error('Inspection not found');

      const currentStatus = inspection.lifecycleStatus;
      this.validateTransition(currentStatus, newStatus);

      inspection.lifecycleStatus = newStatus;
      if (finalStatus && newStatus === 'COMPLETED') {
        inspection.finalStatus = finalStatus;
        inspection.completedAt = new Date();
      }
      if (newStatus === 'ARCHIVED') {
        inspection.archivedAt = new Date();
      }

      await inspection.save({ session });

      await auditLogRepository.create({
        actorId: new Types.ObjectId(actorId),
        actorType: 'USER',
        action: 'INSPECTION_STATUS_CHANGED',
        entityType: 'Inspection',
        entityId: inspection._id as Types.ObjectId,
        inspection: inspection._id as Types.ObjectId,
        changes: [{
          field: 'lifecycleStatus',
          oldValue: currentStatus,
          newValue: newStatus
        }],
        source: 'API'
      }, session);

      return inspection;
    });
  }

  private validateTransition(current: LifecycleStatus, next: LifecycleStatus) {
    const validTransitions: Record<LifecycleStatus, LifecycleStatus[]> = {
      DRAFT: ['PROCESSING'],
      PROCESSING: ['AWAITING_REVIEW'],
      AWAITING_REVIEW: ['COMPLETED'],
      COMPLETED: ['ARCHIVED'],
      ARCHIVED: []
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new Error(`Invalid state transition from ${current} to ${next}`);
    }
  }
}

export const inspectionService = new InspectionService();
