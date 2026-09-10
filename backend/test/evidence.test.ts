import { describe, it, expect, beforeEach } from 'vitest';
import { evidenceService } from '../src/services/EvidenceService';
import { inspectionService } from '../src/services/InspectionService';
import { Evidence } from '../src/db/models/Evidence';
import { Inspection } from '../src/db/models/Inspection';
import { AuditLog } from '../src/db/models/AuditLog';
import mongoose from 'mongoose';

describe('Evidence Service & API Idempotency Integration', () => {
  const inspectorId = new mongoose.Types.ObjectId().toString();
  let inspectionId: string;

  beforeEach(async () => {
    // Only run if mongoose is connected (e.g. when database is available)
    if (mongoose.connection.readyState !== 1) return;

    await Evidence.deleteMany({});
    await Inspection.deleteMany({});
    await AuditLog.deleteMany({});

    const inspection = await inspectionService.createInspection({
      inspectorId,
      productCategory: 'Packaged Food',
      manufacturer: 'Idempotent Corp',
      clientReference: '88888888-8888-8888-8888-888888888888'
    });
    inspectionId = (inspection._id as any).toString();
  });

  it('creates evidence record and increments inspection evidenceCount', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const evidence = await evidenceService.createEvidence({
      inspectorId,
      inspectionId,
      clientEvidenceId: 'ev_unique_001',
      evidenceType: 'PHOTO',
      captureSide: 'FRONT',
      sha256Hash: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      mimeType: 'image/jpeg',
      fileSize: 2048,
      capturedAt: new Date()
    });

    expect(evidence).toBeDefined();
    expect(evidence._id).toBeDefined();
    expect(evidence.captureSide).toBe('FRONT');
    expect(evidence.sha256Hash).toBe('1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff');

    const updatedInspection = await Inspection.findById(inspectionId);
    expect(updatedInspection?.evidenceCount).toBe(1);

    const auditLog = await AuditLog.findOne({ action: 'EVIDENCE_UPLOADED', entityId: evidence._id });
    expect(auditLog).toBeDefined();
  });

  it('guarantees upload idempotency without creating duplicate records on retry', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const payload = {
      inspectorId,
      inspectionId,
      clientEvidenceId: 'ev_retry_idempotency_002',
      evidenceType: 'PHOTO' as const,
      captureSide: 'BACK' as const,
      sha256Hash: 'aaaa222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      mimeType: 'image/jpeg',
      fileSize: 4096,
      capturedAt: new Date()
    };

    // First attempt
    const firstUpload = await evidenceService.createEvidence(payload);

    // Second attempt (e.g. after network timeout replay)
    const secondUpload = await evidenceService.createEvidence(payload);

    expect(firstUpload._id.toString()).toBe(secondUpload._id.toString());

    // Total evidence records in database must still be exactly 1
    const totalCount = await Evidence.countDocuments({ inspection: inspectionId });
    expect(totalCount).toBe(1);

    // Inspection evidenceCount must not be double counted
    const updatedInspection = await Inspection.findById(inspectionId);
    expect(updatedInspection?.evidenceCount).toBe(1);
  });
});
