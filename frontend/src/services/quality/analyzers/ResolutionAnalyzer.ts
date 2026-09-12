import { QualityPolicyConfig } from '../QualityPolicy';
import { QualityIssue } from '../../../types/capture.types';

export interface ResolutionResult {
  width: number;
  height: number;
  aspectRatio: number;
  score: number;
  issues: QualityIssue[];
}

export class ResolutionAnalyzer {
  static analyze(width: number, height: number, policy: QualityPolicyConfig): ResolutionResult {
    const issues: QualityIssue[] = [];
    let score = 100;

    if (width < policy.thresholds.minWidth || height < policy.thresholds.minHeight) {
      score = 0;
      issues.push({
        code: 'LOW_RESOLUTION',
        category: 'RESOLUTION',
        severity: 'HIGH',
        message: 'Resolution is too low for reliable inspection.',
        blocking: policy.blockingRules.failOnLowResolution,
        recommendation: 'Move closer and capture the label at higher detail.'
      });
    }

    return {
      width,
      height,
      aspectRatio: width / height,
      score,
      issues
    };
  }
}
