import { describe, it, expect, beforeEach } from 'vitest';
import { syncQueueStore } from '../services/storage/SyncQueueStore';
import { SyncJob } from '../types/capture.types';

describe('SyncQueueStore', () => {
  const testUserId = 'test_inspector_01';

  beforeEach(async () => {
    // Clean up queue
    const eligible = await syncQueueStore.fetchEligibleJobs(testUserId, 100);
    for (const job of eligible) {
      await syncQueueStore.removeJob(job.jobId);
    }
  });

  it('enqueues jobs and prevents duplicate active jobs with same dedupeKey', async () => {
    const job1: SyncJob = {
      jobId: 'job_001',
      entityType: 'EVIDENCE',
      entityId: 'ev_001',
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-100',
      clientRequestId: 'req_001',
      priority: 80,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: 1000,
      updatedAt: 1000,
      nextAttemptAt: 0,
      dedupeKey: 'INS-100:ev_001:UPLOAD_EVIDENCE',
      userId: testUserId
    };

    const res1 = await syncQueueStore.enqueueJob(job1);
    expect(res1.enqueued).toBe(true);

    // Attempting to enqueue duplicate while active
    const job2: SyncJob = {
      ...job1,
      jobId: 'job_002',
      createdAt: 2000
    };

    const res2 = await syncQueueStore.enqueueJob(job2);
    expect(res2.enqueued).toBe(false);
    expect(res2.jobId).toBe('job_001');
  });

  it('fetches eligible jobs sorted by priority (descending) then createdAt (FIFO)', async () => {
    const jobLowPriority: SyncJob = {
      jobId: 'job_low',
      entityType: 'EVIDENCE',
      entityId: 'ev_side',
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-100',
      clientRequestId: 'req_low',
      priority: 50, // optional side
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: 1000,
      updatedAt: 1000,
      nextAttemptAt: 0,
      dedupeKey: 'INS-100:ev_side:UPLOAD_EVIDENCE',
      userId: testUserId
    };

    const jobHighPriority: SyncJob = {
      jobId: 'job_high',
      entityType: 'EVIDENCE',
      entityId: 'ev_front',
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-100',
      clientRequestId: 'req_high',
      priority: 80, // required front
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: 2000,
      updatedAt: 2000,
      nextAttemptAt: 0,
      dedupeKey: 'INS-100:ev_front:UPLOAD_EVIDENCE',
      userId: testUserId
    };

    await syncQueueStore.enqueueJob(jobLowPriority);
    await syncQueueStore.enqueueJob(jobHighPriority);

    const eligible = await syncQueueStore.fetchEligibleJobs(testUserId, 10);
    expect(eligible.length).toBe(2);
    expect(eligible[0].jobId).toBe('job_high'); // higher priority first
    expect(eligible[1].jobId).toBe('job_low');
  });

  it('claims job and updates status to PROCESSING with lease lock', async () => {
    const job: SyncJob = {
      jobId: 'job_claim_test',
      entityType: 'EVIDENCE',
      entityId: 'ev_claim',
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-100',
      clientRequestId: 'req_claim',
      priority: 80,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: 0,
      dedupeKey: 'INS-100:ev_claim:UPLOAD_EVIDENCE',
      userId: testUserId
    };

    await syncQueueStore.enqueueJob(job);

    const claimed1 = await syncQueueStore.claimJob('job_claim_test', 'worker_1');
    expect(claimed1).toBe(true);

    // Second worker cannot claim already claimed job
    const claimed2 = await syncQueueStore.claimJob('job_claim_test', 'worker_2');
    expect(claimed2).toBe(false);

    const updatedJob = await syncQueueStore.getJob('job_claim_test');
    expect(updatedJob?.status).toBe('PROCESSING');
    expect(updatedJob?.lockedBy).toBe('worker_1');
    expect(updatedJob?.lockedAt).toBeDefined();
  });

  it('completes job successfully and marks SUCCEEDED', async () => {
    const job: SyncJob = {
      jobId: 'job_complete_test',
      entityType: 'EVIDENCE',
      entityId: 'ev_complete',
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-100',
      clientRequestId: 'req_complete',
      priority: 80,
      attemptCount: 0,
      status: 'QUEUED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: 0,
      dedupeKey: 'INS-100:ev_complete:UPLOAD_EVIDENCE',
      userId: testUserId
    };

    await syncQueueStore.enqueueJob(job);
    await syncQueueStore.claimJob('job_complete_test', 'worker_1');
    await syncQueueStore.completeJob('job_complete_test');

    const finished = await syncQueueStore.getJob('job_complete_test');
    expect(finished?.status).toBe('SUCCEEDED');
    expect(finished?.lockedAt).toBeUndefined();
  });

  it('reclaims stale locks after lease expiry', async () => {
    const job: SyncJob = {
      jobId: 'job_stale_test',
      entityType: 'EVIDENCE',
      entityId: 'ev_stale',
      operation: 'UPLOAD_EVIDENCE',
      inspectionId: 'INS-100',
      clientRequestId: 'req_stale',
      priority: 80,
      attemptCount: 0,
      status: 'PROCESSING',
      createdAt: Date.now() - 100_000,
      updatedAt: Date.now() - 100_000,
      lockedAt: Date.now() - 90_000, // locked 90 seconds ago
      lockedBy: 'crashed_worker',
      nextAttemptAt: 0,
      dedupeKey: 'INS-100:ev_stale:UPLOAD_EVIDENCE',
      userId: testUserId
    };

    await syncQueueStore.enqueueJob(job);

    const reclaimedCount = await syncQueueStore.reclaimStaleLocks(60_000); // 60s lease
    expect(reclaimedCount).toBeGreaterThanOrEqual(1);

    const recovered = await syncQueueStore.getJob('job_stale_test');
    expect(recovered?.status).toBe('QUEUED');
    expect(recovered?.lockedBy).toBeUndefined();
  });
});
