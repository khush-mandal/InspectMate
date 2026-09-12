import { FrameCandidate, TargetField, FieldScore } from '../../types/video.types';

export class FieldFrameScorer {
  /**
   * Scores a frame for a specific target field based on region detection and global quality.
   */
  static scoreCandidateForField(candidate: FrameCandidate, field: TargetField): FieldScore | null {
    const region = candidate.detectedRegions[field];
    
    // If the field is not visible in this frame, it's unsuitable.
    if (!region) {
      return null;
    }

    // Base score from the region's detection confidence (50-100)
    let score = region.confidence;
    const reasons: string[] = [];

    // Region Quality (Mock evaluation based on global quality + region size)
    const isAdequateSize = (region.width * region.height) > 5; // e.g., > 5% of frame area
    if (isAdequateSize) {
      score += 10;
      reasons.push('Adequate text region size');
    } else {
      score -= 20;
      reasons.push('Text region is very small');
    }

    // We use the global sharpness/glare as a proxy since we don't have local crop analysis in mock.
    // In a real implementation, we would crop the ImageData to the region and re-run QualityEngine.
    const regionSharpness = candidate.quality.sharpness; 
    
    if (regionSharpness > 80) {
      score += 15;
      reasons.push('High sharpness');
    } else if (regionSharpness < 50) {
      score -= 30;
      reasons.push('Severe blur in region');
    }

    // Glare Penalty
    // Mock: If global glare is high and region is large, assume overlap.
    const glareOverlap = candidate.quality.glare > 15 && isAdequateSize;
    if (glareOverlap) {
      score -= 25;
      reasons.push('Glare overlaps the target region');
    }

    // Text Visibility boost
    if (candidate.quality.textVisibility > 75) {
      score += 10;
      reasons.push('High text contrast');
    }

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score,
      reason: reasons.length ? reasons.join('; ') : 'Average candidate',
      regionQuality: {
        sharpness: regionSharpness,
        glareOverlap,
        textSizeAdequate: isAdequateSize
      }
    };
  }

  /**
   * Compare two frames for the same field for deterministic ranking.
   * Sorts in DESCENDING order (best first).
   * Tie breaking rules:
   * 1. Higher overall score
   * 2. Higher region sharpness
   * 3. Lower glare overlap
   * 4. Larger text region
   * 5. Earlier timestamp
   */
  static compare(a: { candidate: FrameCandidate, score: FieldScore }, b: { candidate: FrameCandidate, score: FieldScore }): number {
    // 1. Higher score wins
    if (a.score.score !== b.score.score) {
      return b.score.score - a.score.score;
    }

    // 2. Higher region sharpness wins
    const aSharpness = a.score.regionQuality?.sharpness || 0;
    const bSharpness = b.score.regionQuality?.sharpness || 0;
    if (aSharpness !== bSharpness) {
      return bSharpness - aSharpness;
    }

    // 3. Lower glare wins
    const aGlare = a.score.regionQuality?.glareOverlap ? 1 : 0;
    const bGlare = b.score.regionQuality?.glareOverlap ? 1 : 0;
    if (aGlare !== bGlare) {
      return aGlare - bGlare; // We want 0 (false) to be < 1 (true), so false comes first
    }

    // 4. Larger region wins
    const aRegion = a.candidate.detectedRegions[Object.keys(a.candidate.detectedRegions)[0] as TargetField]; // Approximation for tie-breaker
    const bRegion = b.candidate.detectedRegions[Object.keys(b.candidate.detectedRegions)[0] as TargetField];
    const aArea = aRegion ? aRegion.width * aRegion.height : 0;
    const bArea = bRegion ? bRegion.width * bRegion.height : 0;
    if (aArea !== bArea) {
      return bArea - aArea;
    }

    // 5. Earlier timestamp wins (deterministic fallback)
    return a.candidate.timestampMs - b.candidate.timestampMs;
  }
}
