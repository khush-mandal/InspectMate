import { QualityPolicyConfig } from '../QualityPolicy';
import { QualityIssue } from '../../../types/capture.types';

export interface TextVisibilityResult {
  contrastScore: number;
  score: number;
  issues: QualityIssue[];
}

export class TextVisibilityAnalyzer {
  /**
   * Provides a basic heuristic for text visibility based on contrast.
   * A more advanced implementation would use Tesseract.js or a lightweight
   * edge-density text detector. Here we approximate by looking at local contrast.
   */
  static analyze(imageData: ImageData, policy: QualityPolicyConfig): TextVisibilityResult {
    // A simple proxy: calculate RMS contrast of the grayscale image
    const { width, height, data } = imageData;
    const totalPixels = width * height;
    
    let sumGray = 0;
    const grays = new Float32Array(totalPixels);
    
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grays[j] = gray;
      sumGray += gray;
    }
    
    const meanGray = sumGray / totalPixels;
    let sumSqrDiff = 0;
    for (let i = 0; i < totalPixels; i++) {
      const diff = grays[i] - meanGray;
      sumSqrDiff += diff * diff;
    }
    
    const rmsContrast = Math.sqrt(sumSqrDiff / totalPixels);
    
    const issues: QualityIssue[] = [];
    let score = 100;

    if (rmsContrast < policy.thresholds.minTextContrast) {
      score = Math.max(0, Math.floor((rmsContrast / policy.thresholds.minTextContrast) * 100));
      issues.push({
        code: 'LOW_CONTRAST',
        category: 'TEXT_VISIBILITY',
        severity: 'MEDIUM',
        message: 'Text contrast appears low.',
        blocking: policy.blockingRules.failOnNoText && rmsContrast < policy.thresholds.minTextContrast / 2,
        recommendation: 'Ensure good lighting and that text is clearly visible.'
      });
    }

    return {
      contrastScore: rmsContrast,
      score,
      issues
    };
  }
}
