import { openDatabase, STORES } from './idb';
import { SyncJob, SyncJobStatus } from '../../types/capture.types';

export const DEFAULT_LEASE_DURATION_MS = 60_000; // 60 seconds

export class SyncQueueStore {
  async enqueueJob(job: SyncJob): Promise<{ enqueued: boolean; jobId: string }> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const dedupeIndex = store.index('dedupeKey');
      const dedupeReq = dedupeIndex.get(job.dedupeKey);

      dedupeReq.onsuccess = () => {
        const existing = dedupeReq.result as SyncJob | undefined;
        if (existing && (existing.status === 'QUEUED' || existing.status === 'READY' || existing.status === 'PROCESSING')) {
          // Job is already pending or actively processing - prevent duplicate
          resolve({ enqueued: false, jobId: existing.jobId });
          return;
        }

        const putReq = store.put(job);
        putReq.onsuccess = () => resolve({ enqueued: true, jobId: job.jobId });
        putReq.onerror = () => reject(putReq.error);
      };

      dedupeReq.onerror = () => reject(dedupeReq.error);
    });
  }

  async getJob(jobId: string): Promise<SyncJob | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.get(jobId);

      req.onsuccess = () => resolve((req.result as SyncJob) || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getJobByDedupeKey(dedupeKey: string): Promise<SyncJob | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('dedupeKey');
      const req = index.get(dedupeKey);

      req.onsuccess = () => resolve((req.result as SyncJob) || null);
      req.onerror = () => reject(req.error);
    });
  }

  async fetchEligibleJobs(userId: string, limit = 5): Promise<SyncJob[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const allJobs = (req.result as SyncJob[]) || [];
        const now = Date.now();

        const eligible = allJobs.filter(job => 
          job.userId === userId &&
          (job.status === 'QUEUED' || job.status === 'READY') &&
          job.nextAttemptAt <= now
        );

        // Sort by priority (highest first) then by createdAt (FIFO)
        eligible.sort((a, b) => {
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }
          return a.createdAt - b.createdAt;
        });

        resolve(eligible.slice(0, limit));
      };

      req.onerror = () => reject(req.error);
    });
  }

  async claimJob(jobId: string, workerId: string): Promise<boolean> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(jobId);

      getReq.onsuccess = () => {
        const job = getReq.result as SyncJob | undefined;
        if (!job || (job.status !== 'QUEUED' && job.status !== 'READY')) {
          resolve(false);
          return;
        }

        job.status = 'PROCESSING';
        job.lockedAt = Date.now();
        job.lockedBy = workerId;
        job.updatedAt = Date.now();

        const putReq = store.put(job);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async completeJob(jobId: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(jobId);

      getReq.onsuccess = () => {
        const job = getReq.result as SyncJob | undefined;
        if (!job) {
          resolve();
          return;
        }

        job.status = 'SUCCEEDED';
        job.updatedAt = Date.now();
        job.lockedAt = undefined;
        job.lockedBy = undefined;

        const putReq = store.put(job);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async failJob(
    jobId: string,
    error: NonNullable<SyncJob['lastError']>,
    nextAttemptAt: number,
    isPermanent = false
  ): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(jobId);

      getReq.onsuccess = () => {
        const job = getReq.result as SyncJob | undefined;
        if (!job) {
          resolve();
          return;
        }

        job.attemptCount += 1;
        job.lastError = error;
        job.nextAttemptAt = nextAttemptAt;
        job.updatedAt = Date.now();
        job.lockedAt = undefined;
        job.lockedBy = undefined;
        job.status = isPermanent ? 'FAILED' : 'QUEUED';

        const putReq = store.put(job);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async releaseClaim(jobId: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(jobId);

      getReq.onsuccess = () => {
        const job = getReq.result as SyncJob | undefined;
        if (!job) {
          resolve();
          return;
        }

        if (job.status === 'PROCESSING') {
          job.status = 'QUEUED';
          job.lockedAt = undefined;
          job.lockedBy = undefined;
          job.updatedAt = Date.now();
          store.put(job);
        }
        resolve();
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async reclaimStaleLocks(leaseTimeoutMs = DEFAULT_LEASE_DURATION_MS): Promise<number> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('status');
      const req = index.getAll('PROCESSING');

      req.onsuccess = () => {
        const jobs = (req.result as SyncJob[]) || [];
        const now = Date.now();
        let reclaimed = 0;

        jobs.forEach(job => {
          if (job.lockedAt && (now - job.lockedAt > leaseTimeoutMs)) {
            job.status = 'QUEUED';
            job.lockedAt = undefined;
            job.lockedBy = undefined;
            job.updatedAt = now;
            store.put(job);
            reclaimed++;
          }
        });

        resolve(reclaimed);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async getQueueSummary(userId: string): Promise<{ queued: number; processing: number; succeeded: number; failed: number }> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const jobs = ((req.result as SyncJob[]) || []).filter(j => j.userId === userId);
        const summary = {
          queued: 0,
          processing: 0,
          succeeded: 0,
          failed: 0
        };

        jobs.forEach(j => {
          if (j.status === 'QUEUED' || j.status === 'READY') summary.queued++;
          else if (j.status === 'PROCESSING') summary.processing++;
          else if (j.status === 'SUCCEEDED') summary.succeeded++;
          else if (j.status === 'FAILED') summary.failed++;
        });

        resolve(summary);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async removeJob(jobId: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.delete(jobId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const syncQueueStore = new SyncQueueStore();
