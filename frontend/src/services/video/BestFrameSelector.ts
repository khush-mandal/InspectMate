import { FrameCandidate, TargetField, VideoProcessingJob, BestFrameResult, FieldScore } from '../../types/video.types';
import { FieldFrameScorer } from './FieldFrameScorer';
import { mediaBlobStore } from '../storage/MediaBlobStore';
import { localEvidenceStore } from '../storage/LocalEvidenceStore';
import { CaptureSlotId } from '../../types/capture.types';

export class BestFrameSelector {
  static async selectAndPersistBestFrames(
    job: VideoProcessingJob,
    candidates: FrameCandidate[],
    slotId: CaptureSlotId,
    userId: string
  ): Promise<VideoProcessingJob> {
    
    const results: Partial<Record<TargetField, BestFrameResult | { status: 'NO_USABLE_FRAME', reason: string }>> = {};
    let coveredFields = 0;

    for (const field of job.requestedFields) {
      // Score all candidates for this field
      const scoredCandidates: { candidate: FrameCandidate, score: FieldScore }[] = [];

      for (const candidate of candidates) {
        const score = FieldFrameScorer.scoreCandidateForField(candidate, field);
        if (score && score.score >= 50) { // Quality threshold
          scoredCandidates.push({ candidate, score });
        }
      }

      if (scoredCandidates.length === 0) {
        results[field] = { status: 'NO_USABLE_FRAME', reason: 'No frame met the minimum quality and visibility threshold for this field.' };
        continue;
      }

      // Sort using deterministic tie-breaker
      scoredCandidates.sort(FieldFrameScorer.compare);

      const best = scoredCandidates[0];
      const alternatives = scoredCandidates.slice(1, 4).map(s => s.candidate.frameId); // Top 3 alternatives

      // Mark candidate as selected
      best.candidate.selectionStatus = 'SELECTED';
      coveredFields++;

      // Persist the best frame to MediaBlobStore and LocalEvidenceStore
      const evidenceId = crypto.randomUUID();
      const localMediaId = `best_frame_${evidenceId}`;

      // We have the transient localUri (object URL), fetch it to get a Blob, then save
      if (best.candidate.localUri) {
        try {
          const response = await fetch(best.candidate.localUri);
          const blob = await response.blob();
          
          await mediaBlobStore.saveBlob(localMediaId, blob);
          best.candidate.localMediaId = localMediaId;

          // Save Evidence Record
          await localEvidenceStore.saveEvidence({
            id: crypto.randomUUID(),
            clientEvidenceId: evidenceId,
            inspectionId: job.inspectionId,
            slotId,
            mode: 'PHOTO', // Derived evidence acts like a photo
            localMediaId,
            mimeType: blob.type,
            fileSize: blob.size,
            width: best.candidate.width,
            height: best.candidate.height,
            sha256: 'pending-hash', // Real implementation would hash the blob
            capturedAt: Date.now(), // Or preserve original capture time
            localCreatedAt: Date.now(),
            syncStatus: 'SYNC_PENDING',
            uploadAttempts: 0,
            isActive: true,
            userId,
            validationResult: { status: 'VALID' },
            frameMetadata: {
              parentVideoEvidenceId: job.videoId,
              frameNumber: best.candidate.frameNumber,
              timestampMs: best.candidate.timestampMs,
              targetField: field,
              selectionScore: best.score.score,
              selectionReason: best.score.reason,
              algorithmVersion: 'best-frame-v1.0',
              policyVersion: 'v1.0'
            }
          });
        } catch (e) {
          console.error("Failed to persist selected frame:", e);
        }
      }

      results[field] = {
        bestFrameId: best.candidate.frameId,
        evidenceId,
        frameNumber: best.candidate.frameNumber,
        timestampMs: best.candidate.timestampMs,
        score: best.score.score,
        reason: best.score.reason,
        alternatives
      };
    }

    job.fieldResults = results;
    job.selectedFrameCount = candidates.filter(c => c.selectionStatus === 'SELECTED').length;
    job.coverageStatus = coveredFields === job.requestedFields.length ? 'FULL' : (coveredFields > 0 ? 'PARTIAL' : 'NONE');
    job.status = 'COMPLETED';
    job.completedAt = Date.now();

    // Cleanup: revoke transient URIs for all candidates
    candidates.forEach(c => {
      if (c.localUri) {
        URL.revokeObjectURL(c.localUri);
      }
    });

    return job;
  }
}
