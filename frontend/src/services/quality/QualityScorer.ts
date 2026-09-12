import { QualityPolicyConfig } from './QualityPolicy';
import { QualityAssessmentStatus, QualityIssue, QualityAssessment } from '../../types/capture.types';

export class QualityScorer {
  static score(
    policy: QualityPolicyConfig,
    resolutionScore: number,
    blurScore: number,
    glareScore: number,
    textScore: number,
    issues: QualityIssue[]
  ): Omit<QualityAssessment, 'assessmentId' | 'processedAt' | 'processingDurationMs' | 'algorithmVersion' | 'policyVersion' | 'checks' | 'diagnosticRegions'> {
    
    // 1. Calculate weighted score
    const totalWeight = policy.weights.resolution + policy.weights.blur + policy.weights.glare + policy.weights.textVisibility;
    
    let weightedScore = 0;
    weightedScore += (resolutionScore * policy.weights.resolution);
    weightedScore += (blurScore * policy.weights.blur);
    weightedScore += (glareScore * policy.weights.glare);
    weightedScore += (textScore * policy.weights.textVisibility);
    
    const finalScore = Math.floor(weightedScore / totalWeight);

    // 2. Determine Decision Status
    const hasBlockingIssues = issues.some(i => i.blocking);
    
    let status: QualityAssessmentStatus = 'ACCEPT';
    
    if (hasBlockingIssues) {
      status = 'RECAPTURE';
    } else if (finalScore < 60) {
      status = 'RECAPTURE';
    } else if (finalScore < 80) {
      status = 'REVIEW';
    }

    // 3. Compile Recommendations
    // Sort issues by severity: HIGH first, then MEDIUM, then LOW.
    const severityRank = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    const sortedIssues = [...issues].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
    
    // Take unique recommendations from the top 3 issues
    const recommendations = Array.from(new Set(
      sortedIssues
        .map(i => i.recommendation)
        .filter((r): r is string => !!r)
    )).slice(0, 3);

    return {
      score: finalScore,
      status,
      issues: sortedIssues,
      recommendations
    };
  }
}
