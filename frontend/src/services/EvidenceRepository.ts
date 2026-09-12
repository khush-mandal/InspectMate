import { localEvidenceStore } from './storage/LocalEvidenceStore';
import { mediaBlobStore } from './storage/MediaBlobStore';
import { syncQueueStore } from './storage/SyncQueueStore';
import { syncCoordinator } from './sync/SyncCoordinator';
import { calculateFileSha256 } from '../utils/crypto.utils';
import { 
  LocalEvidenceRecord, 
  CaptureSlotId, 
  CaptureMode, 
  ValidationResult, 
  SyncJob,
  SyncSummary
} from '../types/capture.types';

export interface SaveEvidenceInput {
  inspectionId: string;
  slotId: CaptureSlotId;
  mode: CaptureMode;
  file: Blob | File;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  durationMs?: number;
  validationResult: ValidationResult;
  userId: string;
  clientEvidenceId?: string;
  qualityAssessment?: any;
}

export class EvidenceRepository {
  async saveEvidence(input: SaveEvidenceInput): Promise<LocalEvidenceRecord> {
    const clientEvidenceId = input.clientEvidenceId || crypto.randomUUID();
    const localMediaId = `media_${clientEvidenceId}`;

    // 1. Calculate authentic SHA-256 hash from file bytes
    const sha256 = await calculateFileSha256(input.file);

    // 2. Persist large media binary in dedicated MediaBlobStore
    await mediaBlobStore.saveBlob(localMediaId, input.file);

    // 3. Create persistent metadata record
    const record: LocalEvidenceRecord = {
      id: crypto.randomUUID(),
      clientEvidenceId,
      inspectionId: input.inspectionId,
      slotId: input.slotId,
      mode: input.mode,
      localMediaId,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      width: input.width,
      height: input.height,
      durationMs: input.durationMs,
      sha256,
      capturedAt: Date.now(),
      localCreatedAt: Date.now(),
      syncStatus: 'SYNC_PENDING',
      uploadAttempts: 0,
      isActive: true,
      userId: input.userId,
      validationResult: input.validationResult,
      qualityAssessment: input.qualityAssessment
    };

    // 4. Atomic metadata save
    await localEvidenceStore.saveEvidence(record);

    // 5. Enqueue persistent sync job with deterministic dedupe key
    const priority = input.slotId === 'FRONT' || input.slotId === 'BACK' ? 80 : 50;
    const syncJob: SyncJob = {
      jobId: `job_${crypto.randomUUID()}`,
      entityType: 'EVIDENCE',
      entityId: clientEvidenceId,
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: input.inspectionId,
      clientRequestId: record.id,
      priority,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: Date.now(),
      dedupeKey: `${input.inspectionId}:${clientEvidenceId}:UPLOAD_EVIDENCE`,
      userId: input.userId
    };

    await syncQueueStore.enqueueJob(syncJob);

    // 6. Create transient runtime preview URL
    record.localUri = await mediaBlobStore.createPreviewUrl(localMediaId) || undefined;

    // 7. Proactively trigger background sync coordinator if online
    syncCoordinator.triggerSync();

    return record;
  }

  async getEvidenceForInspection(inspectionId: string, userId: string): Promise<LocalEvidenceRecord[]> {
    const records = await localEvidenceStore.listEvidenceForInspection(inspectionId, userId);
    
    // Attach preview URLs for local UI rendering
    for (const record of records) {
      if (!record.localUri) {
        record.localUri = (await mediaBlobStore.createPreviewUrl(record.localMediaId)) || undefined;
      }
    }

    return records;
  }

  async retryFailedEvidence(clientEvidenceId: string, userId: string): Promise<void> {
    const record = await localEvidenceStore.getEvidence(clientEvidenceId);
    if (!record) return;

    await localEvidenceStore.markSyncPending(clientEvidenceId);

    const dedupeKey = `${record.inspectionId}:${clientEvidenceId}:UPLOAD_EVIDENCE`;
    let job = await syncQueueStore.getJobByDedupeKey(dedupeKey);

    if (job) {
      job.status = 'QUEUED';
      job.nextAttemptAt = Date.now();
      job.attemptCount = 0; // reset for explicit manual retry
      job.updatedAt = Date.now();
      await syncQueueStore.enqueueJob(job);
    } else {
      const priority = record.slotId === 'FRONT' || record.slotId === 'BACK' ? 80 : 50;
      await syncQueueStore.enqueueJob({
        jobId: `job_${crypto.randomUUID()}`,
        entityType: 'EVIDENCE',
        entityId: clientEvidenceId,
        operation: 'UPLOAD_EVIDENCE',
        inspectionId: record.inspectionId,
        clientRequestId: record.id,
        priority,
        attemptCount: 0,
        status: 'QUEUED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nextAttemptAt: Date.now(),
        dedupeKey,
        userId
      });
    }

    syncCoordinator.triggerSync();
  }

  async removeEvidence(clientEvidenceId: string): Promise<void> {
    const record = await localEvidenceStore.getEvidence(clientEvidenceId);
    if (record) {
      if (record.localUri) {
        mediaBlobStore.revokePreviewUrl(record.localUri);
      }
      await mediaBlobStore.deleteBlob(record.localMediaId);
      await localEvidenceStore.deleteEvidence(clientEvidenceId);
      const dedupeKey = `${record.inspectionId}:${clientEvidenceId}:UPLOAD_EVIDENCE`;
      const job = await syncQueueStore.getJobByDedupeKey(dedupeKey);
      if (job) {
        await syncQueueStore.removeJob(job.jobId);
      }
    }
  }

  async getSyncSummary(inspectionId?: string): Promise<SyncSummary> {
    return syncCoordinator.getSyncSummary(inspectionId);
  }

  async syncNow(): Promise<SyncSummary> {
    return syncCoordinator.syncNow();
  }
}

export const evidenceRepository = new EvidenceRepository();
