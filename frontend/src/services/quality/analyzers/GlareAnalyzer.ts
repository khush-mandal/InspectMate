import { QualityPolicyConfig } from '../QualityPolicy';
import { QualityIssue } from '../../../types/capture.types';

export interface GlareResult {
  glareAreaRatio: number;
  score: number;
  issues: QualityIssue[];
}

export class GlareAnalyzer {
  /**
   * Analyzes an image for glare by detecting the ratio of overexposed (very bright) pixels.
   * If a significant contiguous area or high percentage of the image is white/near-white,
   * it's considered glare.
   */
  static analyze(imageData: ImageData, policy: QualityPolicyConfig): GlareResult {
    const { width, height, data } = imageData;
    const totalPixels = width * height;
    let overexposedCount = 0;

    // Threshold for considering a pixel "glare" (close to white)
    const GLARE_THRESHOLD = 245;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (r > GLARE_THRESHOLD && g > GLARE_THRESHOLD && b > GLARE_THRESHOLD) {
        overexposedCount++;
      }
    }

    const glareAreaRatio = overexposedCount / totalPixels;
    const issues: QualityIssue[] = [];
    let score = 100;

    if (glareAreaRatio > policy.thresholds.maxGlareRatio) {
      score = 0;
      issues.push({
        code: 'GLARE_HIGH',
        category: 'GLARE',
        severity: 'HIGH',
        message: 'Strong reflection may obscure part of the label.',
        blocking: policy.blockingRules.failOnHighGlare || glareAreaRatio > 0.3, // block if extreme
        recommendation: 'Change the camera angle to reduce reflection.'
      });
    } else if (glareAreaRatio > policy.thresholds.maxGlareRatio / 2) {
      score = 50;
      issues.push({
        code: 'GLARE_MODERATE',
        category: 'GLARE',
        severity: 'MEDIUM',
        message: 'Some reflection detected.',
        blocking: false,
        recommendation: 'Try to keep the package surface visible without direct light.'
      });
    }

    return {
      glareAreaRatio,
      score,
      issues
    };
  }
}
