import { localEvidenceStore } from '../storage/LocalEvidenceStore';
import { mediaBlobStore } from '../storage/MediaBlobStore';
import { syncQueueStore } from '../storage/SyncQueueStore';
import { networkMonitor, NetworkStatus } from '../network/NetworkMonitor';
import { defaultRetryPolicy, RetryPolicy } from './RetryPolicy';
import { uploadEvidenceAPI, ApiError } from '../evidenceApi.service';
import { 
  LocalEvidenceRecord, 
  SyncJob, 
  SyncSummary, 
  SyncStatus, 
  SyncErrorCategory 
} from '../../types/capture.types';

export const MAX_CONCURRENT_UPLOADS = 2;

export class SyncCoordinator {
  private userId: string = 'guest';
  private authToken: string | null = null;
  private isProcessing = false;
  private hasPendingRun = false;
  private activeUploads = 0;
  private retryPolicy: RetryPolicy;
  private listeners: Set<() => void> = new Set();
  private isPausedForAuth = false;
  private retryTimer: any = null;

  constructor(retryPolicy: RetryPolicy = defaultRetryPolicy) {
    this.retryPolicy = retryPolicy;
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window !== 'undefined') {
      // 1. Connectivity changes
      networkMonitor.subscribe((status: NetworkStatus) => {
        if (status === 'ONLINE_HEALTHY') {
          this.triggerSync();
        }
      });

      // 2. App returns to foreground
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.triggerSync();
        }
      });

      window.addEventListener('focus', () => {
        this.triggerSync();
      });
    }
  }

  setSession(userId: string, token: string | null) {
    const isNewUser = this.userId !== userId;
    this.userId = userId;
    this.authToken = token;
    this.isPausedForAuth = !token;

    if (isNewUser) {
      this.initSession();
    }
  }

  async initSession(): Promise<void> {
    try {
      // 1. Startup crash recovery: reconcile interrupted SYNCING states
      await localEvidenceStore.reconcileStartupStates(this.userId);
      // 2. Reclaim any stale locks in the sync queue
      await syncQueueStore.reclaimStaleLocks();
      // 3. Verify media integrity for pending jobs
      await this.verifyPendingMediaIntegrity();
      // 4. Trigger initial sync if online
      if (networkMonitor.isOnline() && this.authToken) {
        this.triggerSync();
      }
      this.notifyListeners();
    } catch (err) {
      console.error('Failed to initialize sync session:', err);
    }
  }

  private async verifyPendingMediaIntegrity(): Promise<void> {
    const pending = await localEvidenceStore.listPendingSyncEvidence(this.userId);
    for (const record of pending) {
      const hasBlob = await mediaBlobStore.hasBlob(record.localMediaId);
      if (!hasBlob) {
        await localEvidenceStore.markSyncFailed(record.clientEvidenceId, {
          category: 'FILE_NOT_FOUND',
          code: 'LOCAL_FILE_MISSING',
          message: 'Locally captured media blob is missing from device storage.',
          retryable: false
        });
        const dedupeKey = `${record.inspectionId}:${record.clientEvidenceId}:UPLOAD_EVIDENCE`;
        const job = await syncQueueStore.getJobByDedupeKey(dedupeKey);
        if (job) {
          await syncQueueStore.failJob(job.jobId, {
            category: 'FILE_NOT_FOUND',
            code: 'LOCAL_FILE_MISSING',
            message: 'Locally captured media blob is missing from device storage.',
            retryable: false,
            timestamp: Date.now()
          }, 0, true);
        }
      }
    }
  }

  triggerSync(): void {
    if (this.isPausedForAuth || !this.authToken || !networkMonitor.isOnline()) {
      return;
    }

    this.processQueue();
  }

  async syncNow(): Promise<SyncSummary> {
    await networkMonitor.probeServerHealth();
    
    if (networkMonitor.isOnline() && this.authToken) {
      await this.processQueue();
    }
    return this.getSyncSummary();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      this.hasPendingRun = true;
      return;
    }
    this.isProcessing = true;

    try {
      do {
        this.hasPendingRun = false;
        while (networkMonitor.isOnline() && !this.isPausedForAuth && this.authToken) {
          const availableSlots = MAX_CONCURRENT_UPLOADS - this.activeUploads;
          if (availableSlots <= 0) break;

          const jobs = await syncQueueStore.fetchEligibleJobs(this.userId, availableSlots);
          if (jobs.length === 0) break;

          const promises = jobs.map(job => this.executeJob(job));
          await Promise.all(promises);
        }
      } while (this.hasPendingRun && networkMonitor.isOnline() && !this.isPausedForAuth && this.authToken);
    } finally {
      this.isProcessing = false;
      this.scheduleNextRetry();
      this.notifyListeners();
    }
  }

  private async executeJob(job: SyncJob): Promise<void> {
    const workerId = `worker_${crypto.randomUUID()}`;
    const claimed = await syncQueueStore.claimJob(job.jobId, workerId);
    if (!claimed) return;

    this.activeUploads++;
    this.notifyListeners();

    try {
      if (job.operation === 'UPLOAD_EVIDENCE') {
        await this.handleEvidenceUpload(job);
      }
      await syncQueueStore.completeJob(job.jobId);
    } catch (error: any) {
      await this.handleJobError(job, error);
    } finally {
      this.activeUploads--;
      this.notifyListeners();
    }
  }

  private async handleEvidenceUpload(job: SyncJob): Promise<void> {
    const record = await localEvidenceStore.getEvidence(job.entityId);
    if (!record) {
      throw new Error(`Evidence record ${job.entityId} not found`);
    }

    // 1. Verify local media file exists
    const hasBlob = await mediaBlobStore.hasBlob(record.localMediaId);
    if (!hasBlob) {
      throw new Error('LOCAL_FILE_MISSING: Media blob not found in storage');
    }

    // 2. Mark state as SYNCING
    await localEvidenceStore.markSyncing(record.clientEvidenceId);
    this.notifyListeners();

    // 3. Perform authoritative server upload
    const response = await uploadEvidenceAPI(record, this.authToken);

    // 4. Mark state as SYNCED with authoritative server proof
    await localEvidenceStore.markSynced(
      record.clientEvidenceId,
      response.serverEvidenceId,
      response.uploadedAt
    );
  }

  private async handleJobError(job: SyncJob, error: any): Promise<void> {
    const statusCode = error instanceof ApiError ? error.status : undefined;
    const classified = this.retryPolicy.classifyError(error, statusCode);

    if (classified.category === 'AUTHENTICATION') {
      this.isPausedForAuth = true;
      await syncQueueStore.releaseClaim(job.jobId);
      await localEvidenceStore.markSyncPending(job.entityId);
      return;
    }

    const nextDelay = this.retryPolicy.calculateNextRetryDelay(job.attemptCount);
    const nextAttemptAt = Date.now() + nextDelay;
    const isPermanent = !this.retryPolicy.shouldRetry(job.attemptCount, classified);

    await syncQueueStore.failJob(
      job.jobId,
      {
        category: classified.category,
        code: classified.code,
        message: classified.message,
        retryable: classified.retryable && !isPermanent,
        timestamp: Date.now()
      },
      nextAttemptAt,
      isPermanent
    );

    await localEvidenceStore.markSyncFailed(
      job.entityId,
      classified,
      isPermanent ? undefined : nextAttemptAt
    );
  }

  private scheduleNextRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);

    // Check next upcoming job attempt time
    syncQueueStore.fetchEligibleJobs(this.userId, 1).then(jobs => {
      if (jobs.length > 0) {
        const nextTime = Math.max(0, jobs[0].nextAttemptAt - Date.now());
        this.retryTimer = setTimeout(() => {
          this.triggerSync();
        }, Math.min(nextTime, 30_000));
      }
    });
  }

  async getSyncSummary(inspectionId?: string): Promise<SyncSummary> {
    const records = inspectionId 
      ? await localEvidenceStore.listEvidenceForInspection(inspectionId, this.userId)
      : await localEvidenceStore.listPendingSyncEvidence(this.userId);

    const summary: SyncSummary = {
      total: records.length,
      synced: 0,
      pending: 0,
      syncing: 0,
      failed: 0,
      localOnly: 0,
      isFullySynced: true
    };

    records.forEach(r => {
      if (r.syncStatus === 'SYNCED') summary.synced++;
      else if (r.syncStatus === 'SYNC_PENDING') {
        summary.pending++;
        summary.isFullySynced = false;
      }
      else if (r.syncStatus === 'SYNCING') {
        summary.syncing++;
        summary.isFullySynced = false;
      }
      else if (r.syncStatus === 'SYNC_FAILED') {
        summary.failed++;
        summary.isFullySynced = false;
      }
      else if (r.syncStatus === 'LOCAL_ONLY') {
        summary.localOnly++;
        summary.isFullySynced = false;
      }
    });

    return summary;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Error notifying sync coordinator listener:', err);
      }
    });
  }
}

export const syncCoordinator = new SyncCoordinator();
