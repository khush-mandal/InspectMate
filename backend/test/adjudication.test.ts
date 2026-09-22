import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/index';
import { User } from '../src/db/models/User';
import { Inspection } from '../src/db/models/Inspection';
import { InspectorDecision } from '../src/db/models/InspectorDecision';
import { AuditLog } from '../src/db/models/AuditLog';
import { Evidence } from '../src/db/models/Evidence';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

describe('Human-in-the-Loop Adjudication Integration Tests', () => {
  let inspectorToken: string;
  let inspectorId: mongoose.Types.ObjectId;
  let inspectionId: string;

  beforeEach(async () => {
    const inspector = await User.create({
      email: `inspector_${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
      name: 'Adjudicator Inspector',
      role: 'inspector'
    });
    inspectorId = inspector._id as mongoose.Types.ObjectId;
    inspectorToken = jwt.sign(
      { userId: inspectorId.toString(), role: 'inspector', email: inspector.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const inspection = await Inspection.create({
      inspector: inspectorId,
      clientReference: `TEST-REF-${Date.now()}`,
      lifecycleStatus: 'AWAITING_REVIEW',
      decisionState: 'UNDER_REVIEW',
      productCategory: 'Packaged Food',
      manufacturer: 'Apex Nutraceuticals Pvt Ltd',
      manufacturerNormalized: 'apex nutraceuticals pvt ltd',
      notes: 'Test Packaged Commodity for Adjudication'
    });
    inspectionId = (inspection._id as mongoose.Types.ObjectId).toString();
  });

  it('1. Fetches complete 10-dimension review bundle with preserved machine values', async () => {
    const res = await request(app)
      .get(`/api/inspections/${inspectionId}/review`)
      .set('Authorization', `Bearer ${inspectorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.extractedFields.length).toBeGreaterThan(0);
    expect(res.body.data.violations.length).toBeGreaterThan(0);
    expect(res.body.data.regulations.length).toBeGreaterThan(0);
    expect(res.body.data.detectedConflicts.length).toBeGreaterThan(0);

    // Verify machineValue is defined on every extracted field
    res.body.data.extractedFields.forEach((field: any) => {
      expect(field.machineValue).toBeDefined();
      expect(field.status).toBeDefined();
    });
  });

  it('2. Field review: edits value, strictly preserves machineValue, and records audit trail', async () => {
    // Edit field
    const editRes = await request(app)
      .post(`/api/inspections/${inspectionId}/field-review`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        fieldId: 'field-mrp',
        action: 'EDIT',
        inspectorValue: '₹399.00',
        reason: 'Correction of secondary sticker reading under magnification'
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.success).toBe(true);

    const editedField = editRes.body.field;
    expect(editedField.inspectorValue).toBe('₹399.00');
    expect(editedField.status).toBe('EDITED');
    // MACHINE VALUE MUST REMAIN UNTOUCHED!
    expect(editedField.machineValue).toBe('₹349.00 (Incl. of all taxes)');

    // Verify AuditLog was recorded
    const logs = await AuditLog.find({ inspection: inspectionId, action: 'EXTRACTED_FIELD_REVIEWED' });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].metadata?.machineValue).toBe('₹349.00 (Incl. of all taxes)');
    expect(logs[0].metadata?.inspectorValue).toBe('₹399.00');
  });

  it('3. Violation review: rejecting violation requires mandatory justification reason', async () => {
    // Attempt rejection without justification should fail (400)
    const failRes = await request(app)
      .post(`/api/inspections/${inspectionId}/violation-review`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        violationId: 'viol-dual-pricing',
        action: 'REJECT',
        overrideReason: '' // Empty reason
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.error).toContain('Mandatory statutory justification reason is required');

    // Reject with valid statutory reason succeeds
    const successRes = await request(app)
      .post(`/api/inspections/${inspectionId}/violation-review`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        violationId: 'viol-dual-pricing',
        action: 'REJECT',
        overrideReason: 'Official price revision circular under GST rate notification produced by manufacturer.'
      });

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.violation.status).toBe('REJECTED');
    expect(successRes.body.violation.overrideReason).toBe('Official price revision circular under GST rate notification produced by manufacturer.');
  });

  it('4. Attaches additional evidence without destroying existing evidence', async () => {
    // First attach evidence 1
    const ev1 = await request(app)
      .post(`/api/inspections/${inspectionId}/additional-evidence`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        captureSide: 'PDP_CLOSEUP',
        storageKey: 'evidence_1.jpg',
        qualityScore: 95
      });
    expect(ev1.status).toBe(201);

    // Attach evidence 2
    const ev2 = await request(app)
      .post(`/api/inspections/${inspectionId}/additional-evidence`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        captureSide: 'EXPIRY_STAMP_MACRO',
        storageKey: 'evidence_2.jpg',
        qualityScore: 92
      });
    expect(ev2.status).toBe(201);

    // Both evidences must exist
    const allEv = await Evidence.find({ inspection: inspectionId });
    expect(allEv.length).toBe(2);
  });

  it('5. Guardrail: incomplete evidence CANNOT silently become COMPLIANT', async () => {
    // First initialize review bundle
    await request(app)
      .get(`/api/inspections/${inspectionId}/review`)
      .set('Authorization', `Bearer ${inspectorToken}`);

    // Mark MRP field as unreadable
    await request(app)
      .post(`/api/inspections/${inspectionId}/field-review`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        fieldId: 'field-mrp',
        action: 'MARK_UNREADABLE',
        reason: 'Smudged ink on label'
      });

    // Attempting to finalize as COMPLIANT must be rejected
    const res = await request(app)
      .post(`/api/inspections/${inspectionId}/decision`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        decision: 'COMPLIANT',
        reason: 'All checks supposedly passed'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Incomplete evidence cannot silently become COMPLIANT');
  });

  it('6. Guardrail: unresolved violations block COMPLIANT decision', async () => {
    // Initialize bundle
    await request(app)
      .get(`/api/inspections/${inspectionId}/review`)
      .set('Authorization', `Bearer ${inspectorToken}`);

    // Confirm violation
    await request(app)
      .post(`/api/inspections/${inspectionId}/violation-review`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        violationId: 'viol-dual-pricing',
        action: 'CONFIRM'
      });

    // Attempting COMPLIANT must fail
    const res = await request(app)
      .post(`/api/inspections/${inspectionId}/decision`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        decision: 'COMPLIANT',
        reason: 'Trying to pass despite active violation'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot declare inspection COMPLIANT');
  });

  it('7. Records complete adjudication decision with inspector ID, timestamp, and audit trail', async () => {
    // Initialize bundle
    await request(app)
      .get(`/api/inspections/${inspectionId}/review`)
      .set('Authorization', `Bearer ${inspectorToken}`);

    // Confirm violation
    await request(app)
      .post(`/api/inspections/${inspectionId}/violation-review`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        violationId: 'viol-dual-pricing',
        action: 'CONFIRM'
      });

    // Submit NON_COMPLIANT decision
    const decisionRes = await request(app)
      .post(`/api/inspections/${inspectionId}/decision`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        decision: 'NON_COMPLIANT',
        reason: 'Dual pricing sticker violating Rule 18(1) verified and confirmed by inspector.'
      });

    expect(decisionRes.status).toBe(200);
    expect(decisionRes.body.success).toBe(true);
    expect(decisionRes.body.decision.decision).toBe('NON_COMPLIANT');
    expect(decisionRes.body.decision.inspectorId).toBe(inspectorId.toString());
    expect(decisionRes.body.decision.timestamp).toBeDefined();
    expect(decisionRes.body.decision.reason).toBe('Dual pricing sticker violating Rule 18(1) verified and confirmed by inspector.');

    // Verify stored InspectorDecision in database
    const stored = await InspectorDecision.findOne({ inspectionId });
    expect(stored).toBeDefined();
    expect(stored?.decision).toBe('NON_COMPLIANT');
    expect(stored?.inspectorId).toBe(inspectorId.toString());

    // Verify inspection state
    const updatedInspection = await Inspection.findById(inspectionId);
    expect(updatedInspection?.decisionState).toBe('NON_COMPLIANT');
    expect(updatedInspection?.lifecycleStatus).toBe('COMPLETED');
    expect(updatedInspection?.finalStatus).toBe('POTENTIAL_VIOLATION');
  });
});
