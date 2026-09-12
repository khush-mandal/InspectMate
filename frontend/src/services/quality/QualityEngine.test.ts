import { describe, it, expect } from 'vitest';
import { QualityScorer } from './QualityScorer';
import { defaultQualityPolicy, QualityPolicyConfig } from './QualityPolicy';
import { QualityIssue } from '../../types/capture.types';

describe('QualityScorer', () => {
  const policy: QualityPolicyConfig = defaultQualityPolicy;

  it('should ACCEPT good quality images with high scores', () => {
    const issues: QualityIssue[] = [];
    const result = QualityScorer.score(policy, 100, 95, 90, 85, issues);
    
    expect(result.status).toBe('ACCEPT');
    expect(result.score).toBeGreaterThan(80);
    expect(result.issues.length).toBe(0);
  });

  it('should RECAPTURE when there is a blocking issue', () => {
    const issues: QualityIssue[] = [
      {
        code: 'LOW_RESOLUTION',
        category: 'RESOLUTION',
        severity: 'HIGH',
        message: 'Too small',
        blocking: true
      }
    ];
    // Even if scores are artificially high but a blocking issue exists
    const result = QualityScorer.score(policy, 100, 100, 100, 100, issues);
    
    expect(result.status).toBe('RECAPTURE');
    expect(result.issues.length).toBe(1);
    expect(result.issues[0].code).toBe('LOW_RESOLUTION');
  });

  it('should REVIEW borderline scores (60-79) without blocking issues', () => {
    const issues: QualityIssue[] = [
      {
        code: 'GLARE_MODERATE',
        category: 'GLARE',
        severity: 'MEDIUM',
        message: 'Some glare',
        blocking: false
      }
    ];
    // Weighted score approx 70
    const result = QualityScorer.score(policy, 80, 60, 50, 90, issues);
    
    expect(result.status).toBe('REVIEW');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
  });

  it('should sort recommendations by severity', () => {
    const issues: QualityIssue[] = [
      {
        code: 'GLARE_MODERATE',
        category: 'GLARE',
        severity: 'MEDIUM',
        message: 'Some glare',
        blocking: false,
        recommendation: 'Fix glare'
      },
      {
        code: 'BLUR_DETECTED',
        category: 'BLUR',
        severity: 'HIGH',
        message: 'Blurry',
        blocking: true,
        recommendation: 'Fix blur'
      }
    ];

    const result = QualityScorer.score(policy, 100, 10, 50, 100, issues);
    
    expect(result.status).toBe('RECAPTURE');
    expect(result.recommendations[0]).toBe('Fix blur');
    expect(result.recommendations[1]).toBe('Fix glare');
  });
});
