import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BestFrameSelector } from './BestFrameSelector';
import { VideoProcessingJob, FrameCandidate, TargetField } from '../../types/video.types';

// Mock dependencies
vi.mock('../storage/MediaBlobStore', () => ({
  mediaBlobStore: {
    saveBlob: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../storage/LocalEvidenceStore', () => ({
  localEvidenceStore: {
    saveEvidence: vi.fn().mockResolvedValue(true)
  }
}));

// Setup global fetch mock for object URL retrieval
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob(['mock data'], { type: 'image/jpeg' }))
});

describe('BestFrameSelector', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createJob = (fields: TargetField[]): VideoProcessingJob => ({
    jobId: 'job_1',
    videoId: 'vid_1',
    inspectionId: 'ins_1',
    status: 'PROCESSING',
    processingVersion: 'v1',
    requestedFields: fields,
    requestedAt: Date.now(),
    frameCount: 100,
    sampledFrameCount: 10,
    selectedFrameCount: 0,
    fieldResults: {},
    coverageStatus: 'NONE'
  });

  it('selects best frames and handles NO_USABLE_FRAME', async () => {
    const job = createJob(['MRP', 'NET_QUANTITY', 'DATE']);

    const candidates: FrameCandidate[] = [
      {
        frameId: 'f1', videoEvidenceId: 'vid_1', frameNumber: 1, timestampMs: 1000, localMediaId: '', localUri: 'blob:mock',
        width: 1920, height: 1080, selectionStatus: 'NOT_SELECTED',
        quality: { sharpness: 90, glare: 0, exposure: 50, textVisibility: 90, overallQuality: 90 },
        detectedRegions: {
          'MRP': { x: 10, y: 10, width: 20, height: 20, confidence: 95 }
        }
      },
      {
        frameId: 'f2', videoEvidenceId: 'vid_1', frameNumber: 2, timestampMs: 2000, localMediaId: '', localUri: 'blob:mock',
        width: 1920, height: 1080, selectionStatus: 'NOT_SELECTED',
        quality: { sharpness: 80, glare: 0, exposure: 50, textVisibility: 80, overallQuality: 80 },
        detectedRegions: {
          'NET_QUANTITY': { x: 10, y: 10, width: 20, height: 20, confidence: 90 }
        }
      }
    ];

    const resultJob = await BestFrameSelector.selectAndPersistBestFrames(job, candidates, 'FRONT', 'user_1');

    // MRP should be f1
    expect(resultJob.fieldResults['MRP']).toBeDefined();
    expect((resultJob.fieldResults['MRP'] as any).bestFrameId).toBe('f1');

    // NET_QUANTITY should be f2
    expect(resultJob.fieldResults['NET_QUANTITY']).toBeDefined();
    expect((resultJob.fieldResults['NET_QUANTITY'] as any).bestFrameId).toBe('f2');

    // DATE should be NO_USABLE_FRAME (no candidates had it)
    expect(resultJob.fieldResults['DATE']).toBeDefined();
    expect((resultJob.fieldResults['DATE'] as any)?.status).toBe('NO_USABLE_FRAME');

    expect(resultJob.coverageStatus).toBe('PARTIAL');
    expect(resultJob.selectedFrameCount).toBe(2);
  });

  it('allows the same frame to win multiple fields without duplication', async () => {
    const job = createJob(['MRP', 'DATE']);

    const candidates: FrameCandidate[] = [
      {
        frameId: 'f_super', videoEvidenceId: 'vid_1', frameNumber: 1, timestampMs: 1000, localMediaId: '', localUri: 'blob:mock',
        width: 1920, height: 1080, selectionStatus: 'NOT_SELECTED',
        quality: { sharpness: 95, glare: 0, exposure: 50, textVisibility: 95, overallQuality: 95 },
        detectedRegions: {
          'MRP': { x: 10, y: 10, width: 20, height: 20, confidence: 95 },
          'DATE': { x: 40, y: 40, width: 20, height: 20, confidence: 90 }
        }
      }
    ];

    const resultJob = await BestFrameSelector.selectAndPersistBestFrames(job, candidates, 'FRONT', 'user_1');

    expect((resultJob.fieldResults['MRP'] as any).bestFrameId).toBe('f_super');
    expect((resultJob.fieldResults['DATE'] as any).bestFrameId).toBe('f_super');
    expect(resultJob.coverageStatus).toBe('FULL');
    expect(resultJob.selectedFrameCount).toBe(1); // Only 1 unique frame selected
  });
});
