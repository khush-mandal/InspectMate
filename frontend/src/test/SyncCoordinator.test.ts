import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncCoordinator } from '../services/sync/SyncCoordinator';
import { localEvidenceStore } from '../services/storage/LocalEvidenceStore';
import { mediaBlobStore } from '../services/storage/MediaBlobStore';
import { syncQueueStore } from '../services/storage/SyncQueueStore';
import { networkMonitor } from '../services/network/NetworkMonitor';
import { uploadEvidenceAPI, ApiError } from '../services/evidenceApi.service';
import { calculateFileSha256 } from '../utils/crypto.utils';
import { LocalEvidenceRecord, SyncJob } from '../types/capture.types';

vi.mock('../services/evidenceApi.service', () => ({
  uploadEvidenceAPI: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
}));

describe('SyncCoordinator', () => {
  let testUserId: string;
  let coordinator: SyncCoordinator;

  beforeEach(async () => {
    vi.clearAllMocks();
    testUserId = `test_coord_user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    coordinator = new SyncCoordinator();
    vi.spyOn(networkMonitor, 'isOnline').mockReturnValue(true);
    vi.spyOn(networkMonitor, 'probeServerHealth').mockResolvedValue(true);
    coordinator.setSession(testUserId, 'valid_jwt_token');
    await coordinator.initSession();
  });

  it('coordinates successful evidence upload and transitions to SYNCED', async () => {
    const blob = new Blob(['evidence-test-bytes'], { type: 'image/jpeg' });
    const authenticSha256 = await calculateFileSha256(blob);
    const clientEvidenceId = `ev_coord_${Date.now()}`;
    const localMediaId = `media_${clientEvidenceId}`;
    await mediaBlobStore.saveBlob(localMediaId, blob);

    const record: LocalEvidenceRecord = {
      id: `req_${Date.now()}`,
      clientEvidenceId,
      inspectionId: 'INS-COORD-01',
      slotId: 'FRONT',
      mode: 'PHOTO',
      localMediaId,
      mimeType: 'image/jpeg',
      fileSize: blob.size,
      sha256: authenticSha256,
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNC_PENDING',
      uploadAttempts: 0,
      isActive: true,
      userId: testUserId,
      validationResult: { status: 'VALID' }
    };
    await localEvidenceStore.saveEvidence(record);

    const job: SyncJob = {
      jobId: `job_${clientEvidenceId}`,
      entityType: 'EVIDENCE',
      entityId: clientEvidenceId,
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-COORD-01',
      clientRequestId: record.id,
      idempotencyKey: `idemp_${clientEvidenceId}`,
      priority: 80,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: Date.now(),
      dedupeKey: `INS-COORD-01:${clientEvidenceId}:UPLOAD_EVIDENCE`,
      userId: testUserId
    };
    await syncQueueStore.enqueueJob(job);

    (uploadEvidenceAPI as any).mockResolvedValue({
      serverEvidenceId: 'srv_coord_123',
      inspectionId: 'INS-COORD-01',
      clientEvidenceId,
      sha256Hash: record.sha256,
      uploadedAt: '2026-09-10T12:00:00Z',
      syncStatus: 'SYNCED',
      isIdempotentReplay: false
    });

    // Run syncNow
    await coordinator.syncNow();

    expect(uploadEvidenceAPI).toHaveBeenCalledTimes(1);

    const updatedRecord = await localEvidenceStore.getEvidence(clientEvidenceId);
    expect(updatedRecord?.syncStatus).toBe('SYNCED');
    expect(updatedRecord?.serverEvidenceId).toBe('srv_coord_123');

    const updatedJob = await syncQueueStore.getJob(job.jobId);
    expect(updatedJob?.status).toBe('SUCCEEDED');
    expect(coordinator.getLastSyncTime()).toBeDefined();
  });

  it('detects corrupted media / hash mismatch and halts upload with INTEGRITY_FAILURE', async () => {
    const blob = new Blob(['original-unaltered-bytes'], { type: 'image/jpeg' });
    const clientEvidenceId = `ev_corrupt_${Date.now()}`;
    const localMediaId = `media_${clientEvidenceId}`;
    await mediaBlobStore.saveBlob(localMediaId, blob);

    // Record has a deliberate mismatch (corrupted or tampered metadata)
    const record: LocalEvidenceRecord = {
      id: `req_corrupt_${Date.now()}`,
      clientEvidenceId,
      inspectionId: 'INS-CORRUPT',
      slotId: 'FRONT',
      mode: 'PHOTO',
      localMediaId,
      mimeType: 'image/jpeg',
      fileSize: blob.size,
      sha256: 'deadbeef'.repeat(8), // Incorrect hash
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNC_PENDING',
      uploadAttempts: 0,
      isActive: true,
      userId: testUserId,
      validationResult: { status: 'VALID' }
    };
    await localEvidenceStore.saveEvidence(record);

    const job: SyncJob = {
      jobId: `job_${clientEvidenceId}`,
      entityType: 'EVIDENCE',
      entityId: clientEvidenceId,
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-CORRUPT',
      clientRequestId: record.id,
      priority: 80,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: Date.now(),
      dedupeKey: `INS-CORRUPT:${clientEvidenceId}:UPLOAD_EVIDENCE`,
      userId: testUserId
    };
    await syncQueueStore.enqueueJob(job);

    await coordinator.syncNow();

    // Must NOT call upload API if integrity check fails!
    expect(uploadEvidenceAPI).not.toHaveBeenCalled();

    const updatedRecord = await localEvidenceStore.getEvidence(clientEvidenceId);
    expect(updatedRecord?.syncStatus).toBe('SYNC_FAILED');
    expect(updatedRecord?.lastErrorCategory).toBe('INTEGRITY_FAILURE');
  });

  it('marks SYNC_FAILED with LOCAL_FILE_MISSING when media blob is missing from storage', async () => {
    const clientEvidenceId = `ev_missing_${Date.now()}`;
    const localMediaId = `media_non_existent_${Date.now()}`;

    const record: LocalEvidenceRecord = {
      id: `req_missing_${Date.now()}`,
      clientEvidenceId,
      inspectionId: 'INS-MISSING',
      slotId: 'BACK',
      mode: 'PHOTO',
      localMediaId,
      mimeType: 'image/jpeg',
      fileSize: 100,
      sha256: 'e'.repeat(64),
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNC_PENDING',
      uploadAttempts: 0,
      isActive: true,
      userId: testUserId,
      validationResult: { status: 'VALID' }
    };
    await localEvidenceStore.saveEvidence(record);

    const job: SyncJob = {
      jobId: `job_${clientEvidenceId}`,
      entityType: 'EVIDENCE',
      entityId: clientEvidenceId,
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-MISSING',
      clientRequestId: record.id,
      priority: 80,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: Date.now(),
      dedupeKey: `INS-MISSING:${clientEvidenceId}:UPLOAD_EVIDENCE`,
      userId: testUserId
    };
    await syncQueueStore.enqueueJob(job);

    await coordinator.syncNow();

    const updatedRecord = await localEvidenceStore.getEvidence(clientEvidenceId);
    expect(updatedRecord?.syncStatus).toBe('SYNC_FAILED');
    expect(updatedRecord?.lastErrorCode).toBe('LOCAL_FILE_MISSING');
  });

  it('reconciles interrupted SYNCING records on app startup crash recovery', async () => {
    const clientEvidenceId = `ev_crash_${Date.now()}`;
    const localMediaId = `media_${clientEvidenceId}`;

    const record: LocalEvidenceRecord = {
      id: `req_crash_${Date.now()}`,
      clientEvidenceId,
      inspectionId: 'INS-CRASH',
      slotId: 'FRONT',
      mode: 'PHOTO',
      localMediaId,
      mimeType: 'image/jpeg',
      fileSize: 50,
      sha256: 'a'.repeat(64),
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNCING', // Interrupted during previous session crash
      uploadAttempts: 1,
      isActive: true,
      userId: testUserId,
      validationResult: { status: 'VALID' }
    };
    await localEvidenceStore.saveEvidence(record);

    // Run startup reconciliation
    await localEvidenceStore.reconcileStartupStates(testUserId);

    const recovered = await localEvidenceStore.getEvidence(clientEvidenceId);
    expect(recovered?.syncStatus).toBe('SYNC_PENDING');
  });

  it('pauses coordinator when 401 unauthenticated error is encountered', async () => {
    const blob = new Blob(['auth-test-bytes'], { type: 'image/jpeg' });
    const authenticSha256 = await calculateFileSha256(blob);
    const clientEvidenceId = `ev_auth_${Date.now()}`;
    const localMediaId = `media_${clientEvidenceId}`;
    await mediaBlobStore.saveBlob(localMediaId, blob);

    const record: LocalEvidenceRecord = {
      id: `req_auth_${Date.now()}`,
      clientEvidenceId,
      inspectionId: 'INS-AUTH',
      slotId: 'FRONT',
      mode: 'PHOTO',
      localMediaId,
      mimeType: 'image/jpeg',
      fileSize: blob.size,
      sha256: authenticSha256,
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNC_PENDING',
      uploadAttempts: 0,
      isActive: true,
      userId: testUserId,
      validationResult: { status: 'VALID' }
    };
    await localEvidenceStore.saveEvidence(record);

    const job: SyncJob = {
      jobId: `job_${clientEvidenceId}`,
      entityType: 'EVIDENCE',
      entityId: clientEvidenceId,
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-AUTH',
      clientRequestId: record.id,
      priority: 80,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: Date.now(),
      dedupeKey: `INS-AUTH:${clientEvidenceId}:UPLOAD_EVIDENCE`,
      userId: testUserId
    };
    await syncQueueStore.enqueueJob(job);

    // Mock 401 ApiError
    (uploadEvidenceAPI as any).mockRejectedValue(new (ApiError as any)('Session expired', 401));

    await coordinator.syncNow();

    const queuedJob = await syncQueueStore.getJob(job.jobId);
    // Lock must be released and job remains eligible for retry once re-authenticated
    expect(queuedJob?.status).toBe('QUEUED');
    expect(queuedJob?.lockedAt).toBeUndefined();
  });
});
