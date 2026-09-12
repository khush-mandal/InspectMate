import { QualityPolicyConfig } from '../QualityPolicy';
import { QualityIssue } from '../../../types/capture.types';

export interface BlurResult {
  variance: number;
  score: number;
  issues: QualityIssue[];
}

export class BlurAnalyzer {
  /**
   * Calculates the variance of the Laplacian of an image to determine sharpness.
   * Higher variance = sharper. Lower variance = blurrier.
   */
  static analyze(imageData: ImageData, policy: QualityPolicyConfig): BlurResult {
    const variance = this.calculateLaplacianVariance(imageData);
    const issues: QualityIssue[] = [];
    let score = 100;
    
    // Score scaling: variance maxes out practically around 1000 for very sharp,
    // and can be very low (e.g., < 50) for very blurry.
    const threshold = policy.thresholds.minBlurVariance;
    if (variance < threshold) {
      score = Math.max(0, Math.floor((variance / threshold) * 100));
      issues.push({
        code: 'BLUR_DETECTED',
        category: 'BLUR',
        severity: 'HIGH',
        message: 'The image is too blurry to read.',
        blocking: policy.blockingRules.failOnHighBlur,
        recommendation: 'Hold the device steady and move closer to the label.'
      });
    } else {
      // Scale score between threshold and a sensible max (e.g., 500)
      const maxVar = Math.max(threshold * 5, 500);
      score = Math.min(100, Math.floor(100 * (variance - threshold) / (maxVar - threshold)));
      // Bump it up to 100 if it passes threshold comfortably
      if (score < 50) score = 80;
    }

    return {
      variance,
      score,
      issues
    };
  }

  private static calculateLaplacianVariance(imageData: ImageData): number {
    const { width, height, data } = imageData;
    const laplacian = new Float32Array(width * height);
    
    // We compute the laplacian using a 3x3 kernel:
    // [0,  1, 0]
    // [1, -4, 1]
    // [0,  1, 0]
    // 
    // First, we convert to grayscale on the fly.
    const getGray = (x: number, y: number) => {
      const idx = (y * width + x) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    let mean = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const top = getGray(x, y - 1);
        const bottom = getGray(x, y + 1);
        const left = getGray(x - 1, y);
        const right = getGray(x + 1, y);
        const center = getGray(x, y);

        const l = top + bottom + left + right - 4 * center;
        laplacian[count] = l;
        mean += l;
        count++;
      }
    }

    if (count === 0) return 0;
    mean /= count;

    let variance = 0;
    for (let i = 0; i < count; i++) {
      const diff = laplacian[i] - mean;
      variance += diff * diff;
    }
    return variance / count;
  }
}
