import { describe, it, expect } from 'vitest';
import { inspectionService } from '../src/services/InspectionService';
import { Inspection } from '../src/db/models/Inspection';
import { AuditLog } from '../src/db/models/AuditLog';
import { User } from '../src/db/models/User';
import mongoose from 'mongoose';

describe('Inspection Service Integration', () => {
  it('should create an inspection idempotently', async () => {
    const inspectorId = new mongoose.Types.ObjectId().toString();
    const clientReference = 'unique-offline-ref-123';

    // First request
    const inspection1 = await inspectionService.createInspection({
      inspectorId,
      clientReference,
      productCategory: 'Electronics'
    });

    expect(inspection1).toBeDefined();
    expect(inspection1.clientReference).toBe(clientReference);

    // Simulated retry (second request with same clientReference)
    const inspection2 = await inspectionService.createInspection({
      inspectorId,
      clientReference,
      productCategory: 'Electronics'
    });

    expect(inspection2).toBeDefined();
    // They should be the exact same document
    expect(inspection2._id.toString()).toBe(inspection1._id.toString());

    // Verify only one was created in DB
    const count = await Inspection.countDocuments({ clientReference });
    expect(count).toBe(1);
  });

  it('should create an audit log within the same transaction as inspection creation', async () => {
    const inspectorId = new mongoose.Types.ObjectId().toString();

    const inspection = await inspectionService.createInspection({
      inspectorId,
      productCategory: 'Food'
    });

    // Check if AuditLog was created
    const auditLogs = await AuditLog.find({ inspection: inspection._id });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].action).toBe('INSPECTION_CREATED');
  });

  it('should rollback transaction on failure', async () => {
    const inspectorId = new mongoose.Types.ObjectId().toString();

    // To simulate a failure during transaction, we mock the audit repository to throw
    const { auditLogRepository } = await import('../src/db/repositories/AuditLogRepository');
    const originalCreate = auditLogRepository.create;
    
    // @ts-ignore
    auditLogRepository.create = async () => {
      throw new Error('Simulated audit failure');
    };

    try {
      await inspectionService.createInspection({
        inspectorId,
        productCategory: 'Toys',
        clientReference: 'rollback-ref'
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (e) {
      // Expected failure
    }

    // Restore original method
    auditLogRepository.create = originalCreate;

    // Verify the inspection was NOT partially committed
    const count = await Inspection.countDocuments({ clientReference: 'rollback-ref' });
    expect(count).toBe(0); // Rollback successful
  });

  it('should enforce state transitions', async () => {
    const inspectorId = new mongoose.Types.ObjectId().toString();
    let inspection: any;
    try {
      inspection = await inspectionService.createInspection({ inspectorId });
    } catch (err: any) {
      if (err.code === 112) {
        // WriteConflict retry
        await new Promise(res => setTimeout(res, 50));
        inspection = await inspectionService.createInspection({ inspectorId });
      } else throw err;
    }

    // Valid: DRAFT -> PROCESSING
    const updated1 = await inspectionService.transitionStatus(inspection._id.toString(), 'PROCESSING', inspectorId);
    expect(updated1?.lifecycleStatus).toBe('PROCESSING');

    // Invalid: PROCESSING -> COMPLETED (Must go through AWAITING_REVIEW)
    await expect(
      inspectionService.transitionStatus(inspection._id.toString(), 'COMPLETED', inspectorId)
    ).rejects.toThrow('Invalid state transition');
  });
});
