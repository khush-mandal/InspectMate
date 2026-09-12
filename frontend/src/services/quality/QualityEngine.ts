import { QualityAssessment, QualityIssue } from '../../types/capture.types';
import { QualityPolicyConfig, defaultQualityPolicy, CURRENT_ALGORITHM_VERSION, CURRENT_POLICY_VERSION } from './QualityPolicy';
import { ResolutionAnalyzer } from './analyzers/ResolutionAnalyzer';
import { BlurAnalyzer } from './analyzers/BlurAnalyzer';
import { GlareAnalyzer } from './analyzers/GlareAnalyzer';
import { TextVisibilityAnalyzer } from './analyzers/TextVisibilityAnalyzer';
import { QualityScorer } from './QualityScorer';

export class QualityEngine {
  /**
   * Main entrypoint for evidence quality assessment.
   * Runs non-destructively on the provided file/blob.
   */
  static async analyze(
    file: Blob,
    policy: QualityPolicyConfig = defaultQualityPolicy
  ): Promise<QualityAssessment> {
    const startTime = performance.now();

    try {
      // 1. Preprocessing: Decode image into a Canvas to get ImageData
      const { imageData, width, height } = await this.getImageDataForAnalysis(file);

      // 2. Run Analyzers
      const resolutionResult = ResolutionAnalyzer.analyze(width, height, policy);
      
      // The heavy CV checks (blur, glare, text) use the imageData.
      // We process them sequentially here, but could be done concurrently via Web Workers if extremely large.
      const blurResult = BlurAnalyzer.analyze(imageData, policy);
      const glareResult = GlareAnalyzer.analyze(imageData, policy);
      const textResult = TextVisibilityAnalyzer.analyze(imageData, policy);

      // 3. Aggregate Issues
      const issues: QualityIssue[] = [
        ...resolutionResult.issues,
        ...blurResult.issues,
        ...glareResult.issues,
        ...textResult.issues
      ];

      // 4. Score and Decision
      const scoringResult = QualityScorer.score(
        policy,
        resolutionResult.score,
        blurResult.score,
        glareResult.score,
        textResult.score,
        issues
      );

      const endTime = performance.now();

      // 5. Construct Final Assessment
      return {
        assessmentId: `qa_${crypto.randomUUID()}`,
        status: scoringResult.status,
        score: scoringResult.score,
        algorithmVersion: CURRENT_ALGORITHM_VERSION,
        policyVersion: CURRENT_POLICY_VERSION,
        checks: {
          resolution: { width: resolutionResult.width, height: resolutionResult.height, score: resolutionResult.score },
          blur: { variance: blurResult.variance, score: blurResult.score },
          glare: { areaRatio: glareResult.glareAreaRatio, score: glareResult.score },
          textVisibility: { contrast: textResult.contrastScore, score: textResult.score }
        },
        issues: scoringResult.issues,
        diagnosticRegions: [], // Placeholders for later region-specific features
        recommendations: scoringResult.recommendations,
        processedAt: Date.now(),
        processingDurationMs: Math.round(endTime - startTime)
      };

    } catch (error) {
      console.error('QualityEngine analysis failed:', error);
      const endTime = performance.now();
      return {
        assessmentId: `qa_${crypto.randomUUID()}`,
        status: 'ERROR',
        score: 0,
        algorithmVersion: CURRENT_ALGORITHM_VERSION,
        policyVersion: CURRENT_POLICY_VERSION,
        checks: {},
        issues: [{
          code: 'ANALYSIS_FAILED',
          category: 'SYSTEM',
          severity: 'HIGH',
          message: 'Quality analysis could not be completed due to a processing error.',
          blocking: false,
          recommendation: 'Try taking the picture again.'
        }],
        diagnosticRegions: [],
        recommendations: ['Try taking the picture again.'],
        processedAt: Date.now(),
        processingDurationMs: Math.round(endTime - startTime)
      };
    }
  }

  /**
   * Decodes a Blob/File into an ImageData object by drawing it onto an offscreen canvas.
   * We resize the image slightly to avoid out-of-memory errors on massive 4K+ images
   * while preserving enough detail for Variance of Laplacian and Glare detection.
   */
  private static async getImageDataForAnalysis(file: Blob): Promise<{ imageData: ImageData, width: number, height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Target a max dimension to speed up processing without losing significant detail.
        const MAX_DIMENSION = 1200; 
        let drawWidth = img.width;
        let drawHeight = img.height;

        if (drawWidth > MAX_DIMENSION || drawHeight > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / drawWidth, MAX_DIMENSION / drawHeight);
          drawWidth = Math.floor(drawWidth * ratio);
          drawHeight = Math.floor(drawHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Could not get 2d context'));
          return;
        }

        ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
        
        try {
          const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
          // Return original width/height for resolution checking, but the processed ImageData
          resolve({ imageData, width: img.width, height: img.height });
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for processing'));
      };
      img.src = url;
    });
  }
}
