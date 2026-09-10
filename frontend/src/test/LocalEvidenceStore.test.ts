import { describe, it, expect } from 'vitest';
import { localEvidenceStore } from '../services/storage/LocalEvidenceStore';
import { LocalEvidenceRecord } from '../types/capture.types';

describe('LocalEvidenceStore', () => {
  const userA = 'inspector_alpha';
  const userB = 'inspector_bravo';

  it('saves and retrieves evidence metadata with account scoping', async () => {
    const recordA: LocalEvidenceRecord = {
      id: 'rec_01',
      clientEvidenceId: 'ev_user_a',
      inspectionId: 'INS-A-001',
      slotId: 'FRONT',
      mode: 'PHOTO',
      localMediaId: 'media_ev_user_a',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      sha256: 'a'.repeat(64),
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNC_PENDING',
      uploadAttempts: 0,
      isActive: true,
      userId: userA,
      validationResult: { status: 'VALID' }
    };

    await localEvidenceStore.saveEvidence(recordA);

    // User A can access their evidence
    const listA = await localEvidenceStore.listEvidenceForInspection('INS-A-001', userA);
    expect(listA.length).toBe(1);
    expect(listA[0].clientEvidenceId).toBe('ev_user_a');

    // User B cannot access User A's evidence (Account isolation)
    const listB = await localEvidenceStore.listEvidenceForInspection('INS-A-001', userB);
    expect(listB.length).toBe(0);
  });

  it('transitions state safely from SYNC_PENDING -> SYNCING -> SYNCED with server confirmation', async () => {
    const record: LocalEvidenceRecord = {
      id: 'rec_02',
      clientEvidenceId: 'ev_sync_flow',
      inspectionId: 'INS-002',
      slotId: 'BACK',
      mode: 'PHOTO',
      localMediaId: 'media_sync_flow',
      mimeType: 'image/jpeg',
      fileSize: 2048,
      sha256: 'b'.repeat(64),
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNC_PENDING',
      uploadAttempts: 0,
      isActive: true,
      userId: userA,
      validationResult: { status: 'VALID' }
    };

    await localEvidenceStore.saveEvidence(record);

    // 1. Mark SYNCING
    await localEvidenceStore.markSyncing('ev_sync_flow');
    const syncing = await localEvidenceStore.getEvidence('ev_sync_flow');
    expect(syncing?.syncStatus).toBe('SYNCING');
    expect(syncing?.lastAttemptAt).toBeDefined();

    // 2. Mark SYNCED with server confirmation
    await localEvidenceStore.markSynced('ev_sync_flow', 'srv_confirmed_999', '2026-09-10T12:00:00Z');
    const synced = await localEvidenceStore.getEvidence('ev_sync_flow');
    expect(synced?.syncStatus).toBe('SYNCED');
    expect(synced?.serverEvidenceId).toBe('srv_confirmed_999');
    expect(synced?.serverUploadedAt).toBe('2026-09-10T12:00:00Z');
  });

  it('reconciles interrupted SYNCING states on startup crash recovery', async () => {
    const recordCrash: LocalEvidenceRecord = {
      id: 'rec_crash',
      clientEvidenceId: 'ev_crashed_during_upload',
      inspectionId: 'INS-CRASH',
      slotId: 'SIDE',
      mode: 'VIDEO',
      localMediaId: 'media_crash',
      mimeType: 'video/webm',
      fileSize: 10000,
      sha256: 'c'.repeat(64),
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNCING', // Interrupted without server confirmation
      uploadAttempts: 1,
      isActive: true,
      userId: userA,
      validationResult: { status: 'VALID' }
    };

    await localEvidenceStore.saveEvidence(recordCrash);

    // Run startup reconciliation
    const result = await localEvidenceStore.reconcileStartupStates(userA);
    expect(result.resetSyncingCount).toBeGreaterThanOrEqual(1);

    const recovered = await localEvidenceStore.getEvidence('ev_crashed_during_upload');
    expect(recovered?.syncStatus).toBe('SYNC_PENDING');
    expect(recovered?.serverEvidenceId).toBeUndefined();
  });
});
