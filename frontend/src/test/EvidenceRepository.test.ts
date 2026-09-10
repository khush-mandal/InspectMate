import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evidenceRepository } from '../services/EvidenceRepository';
import { localEvidenceStore } from '../services/storage/LocalEvidenceStore';
import { mediaBlobStore } from '../services/storage/MediaBlobStore';
import { syncQueueStore } from '../services/storage/SyncQueueStore';
import { networkMonitor } from '../services/network/NetworkMonitor';
import * as evidenceApi from '../services/evidenceApi.service';

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

describe('EvidenceRepository', () => {
  const testUserId = 'test_repo_user';
  const testInspectionId = 'INS-REPO-100';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves evidence durably with segregated blob storage and sha256 calculation', async () => {
    const file = new File(['mock-camera-capture-content'], 'front.jpg', { type: 'image/jpeg' });

    const record = await evidenceRepository.saveEvidence({
      inspectionId: testInspectionId,
      slotId: 'FRONT',
      mode: 'PHOTO',
      file,
      mimeType: 'image/jpeg',
      fileSize: file.size,
      validationResult: { status: 'VALID' },
      userId: testUserId
    });

    expect(record).toBeDefined();
    expect(record.clientEvidenceId).toBeDefined();
    expect(record.syncStatus).toBe('SYNC_PENDING');
    expect(record.sha256).toBeDefined();
    expect(record.sha256.length).toBe(64);
    expect(record.localUri).toBeDefined();

    // Verify binary is in MediaBlobStore
    const blobExists = await mediaBlobStore.hasBlob(record.localMediaId);
    expect(blobExists).toBe(true);

    // Verify metadata is in LocalEvidenceStore
    const metaRecord = await localEvidenceStore.getEvidence(record.clientEvidenceId);
    expect(metaRecord).toBeDefined();
    expect(metaRecord?.sha256).toBe(record.sha256);

    // Verify job is enqueued in SyncQueueStore
    const dedupeKey = `${testInspectionId}:${record.clientEvidenceId}:UPLOAD_EVIDENCE`;
    const job = await syncQueueStore.getJobByDedupeKey(dedupeKey);
    expect(job).toBeDefined();
    expect(job?.priority).toBe(80); // Front slot = required = 80
  });

  it('retrieves evidence list for inspection with preview URLs', async () => {
    const records = await evidenceRepository.getEvidenceForInspection(testInspectionId, testUserId);
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records[0].localUri).toBeDefined();
  });

  it('retries failed evidence by resetting status and triggering sync', async () => {
    const file = new File(['retry-test-content'], 'back.jpg', { type: 'image/jpeg' });
    const record = await evidenceRepository.saveEvidence({
      inspectionId: 'INS-RETRY-01',
      slotId: 'BACK',
      mode: 'PHOTO',
      file,
      mimeType: 'image/jpeg',
      fileSize: file.size,
      validationResult: { status: 'VALID' },
      userId: testUserId
    });

    // Mark failed
    await localEvidenceStore.markSyncFailed(record.clientEvidenceId, {
      category: 'SERVER',
      code: 'HTTP_500',
      message: 'Internal server error',
      retryable: true
    });

    let failedRecord = await localEvidenceStore.getEvidence(record.clientEvidenceId);
    expect(failedRecord?.syncStatus).toBe('SYNC_FAILED');

    // User triggers retry
    await evidenceRepository.retryFailedEvidence(record.clientEvidenceId, testUserId);

    let retriedRecord = await localEvidenceStore.getEvidence(record.clientEvidenceId);
    expect(retriedRecord?.syncStatus).toBe('SYNC_PENDING');
  });
});
