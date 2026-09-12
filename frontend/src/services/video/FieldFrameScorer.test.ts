import { describe, it, expect } from 'vitest';
import { FieldFrameScorer } from './FieldFrameScorer';
import { FrameCandidate, TargetField } from '../../types/video.types';

describe('FieldFrameScorer', () => {

  const createMockCandidate = (
    id: string,
    field: TargetField,
    confidence: number,
    globalSharpness: number,
    globalGlare: number,
    regionWidth: number,
    regionHeight: number,
    timestampMs: number
  ): FrameCandidate => {
    return {
      frameId: id,
      videoEvidenceId: 'vid_123',
      frameNumber: timestampMs / 1000 * 30, // rough approx
      timestampMs,
      localMediaId: '',
      width: 1920,
      height: 1080,
      quality: {
        sharpness: globalSharpness,
        glare: globalGlare,
        exposure: 50,
        textVisibility: 80,
        overallQuality: 80
      },
      detectedRegions: {
        [field]: { x: 10, y: 10, width: regionWidth, height: regionHeight, confidence }
      },
      selectionStatus: 'NOT_SELECTED'
    };
  };

  it('scores a candidate based on region and quality', () => {
    const candidate = createMockCandidate('frame_1', 'MRP', 90, 85, 5, 20, 20, 1000);
    const result = FieldFrameScorer.scoreCandidateForField(candidate, 'MRP');
    
    expect(result).not.toBeNull();
    // Base 90 + 10 (size) + 15 (sharpness) + 10 (textVis) = ~100 (capped)
    expect(result?.score).toBe(100);
  });

  it('penalizes severe blur', () => {
    const candidate = createMockCandidate('frame_1', 'MRP', 90, 40, 5, 20, 20, 1000);
    const result = FieldFrameScorer.scoreCandidateForField(candidate, 'MRP');
    
    expect(result).not.toBeNull();
    // Base 90 + 10 (size) - 30 (blur) + 10 (textVis) = 80
    expect(result?.score).toBe(80);
    expect(result?.reason).toContain('Severe blur');
  });

  it('handles tie breaking correctly: score > sharpness > glare > size > timestamp', () => {
    // 1. Same score, different sharpness
    const c1 = createMockCandidate('c1', 'MRP', 70, 90, 5, 20, 20, 1000);
    const c2 = createMockCandidate('c2', 'MRP', 70, 80, 5, 20, 20, 1000);
    
    // Ensure scores are equal for the tie-break test by overriding
    const s1 = FieldFrameScorer.scoreCandidateForField(c1, 'MRP')!;
    const s2 = FieldFrameScorer.scoreCandidateForField(c2, 'MRP')!;
    s1.score = 80;
    s2.score = 80;

    const rank = [ { candidate: c1, score: s1 }, { candidate: c2, score: s2 } ];
    rank.sort(FieldFrameScorer.compare);
    
    // c1 has higher sharpness (90 > 80), so it should be first
    expect(rank[0].candidate.frameId).toBe('c1');

    // 2. Same score and sharpness, different glare
    const c3 = createMockCandidate('c3', 'MRP', 70, 90, 20, 20, 20, 1000); // Has glare overlap
    const c4 = createMockCandidate('c4', 'MRP', 70, 90, 5, 20, 20, 1000); // No glare overlap
    const s3 = FieldFrameScorer.scoreCandidateForField(c3, 'MRP')!;
    const s4 = FieldFrameScorer.scoreCandidateForField(c4, 'MRP')!;
    s3.score = 80; s4.score = 80;
    s3.regionQuality!.sharpness = 90; s4.regionQuality!.sharpness = 90;
    
    const rank2 = [ { candidate: c3, score: s3 }, { candidate: c4, score: s4 } ];
    rank2.sort(FieldFrameScorer.compare);

    // c4 has no glare, so it should be first
    expect(rank2[0].candidate.frameId).toBe('c4');
  });

  it('evaluates fields independently', () => {
    const candidate: FrameCandidate = {
      frameId: 'c1',
      videoEvidenceId: 'vid',
      frameNumber: 1,
      timestampMs: 1000,
      localMediaId: '',
      width: 1920,
      height: 1080,
      quality: { sharpness: 80, glare: 0, exposure: 50, textVisibility: 90, overallQuality: 85 },
      detectedRegions: {
        'MRP': { x: 10, y: 10, width: 20, height: 20, confidence: 95 },
        'NET_QUANTITY': { x: 50, y: 50, width: 2, height: 2, confidence: 40 }
      },
      selectionStatus: 'NOT_SELECTED'
    };

    const mrpScore = FieldFrameScorer.scoreCandidateForField(candidate, 'MRP');
    const netQtyScore = FieldFrameScorer.scoreCandidateForField(candidate, 'NET_QUANTITY');

    expect(mrpScore).not.toBeNull();
    expect(mrpScore!.score).toBeGreaterThan(90);

    expect(netQtyScore).not.toBeNull();
    // Net quantity has tiny region (width 2, height 2 = area 4, < 5) so it gets penalized
    expect(netQtyScore!.score).toBeLessThan(mrpScore!.score);
  });
});
