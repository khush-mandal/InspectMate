import { QualityIssue } from '../../types/capture.types';

export const CURRENT_ALGORITHM_VERSION = 'quality-gate-v1.0';
export const CURRENT_POLICY_VERSION = '1.0';

export interface QualityPolicyConfig {
  thresholds: {
    minWidth: number;
    minHeight: number;
    minBlurVariance: number;
    maxGlareRatio: number;
    minTextContrast: number;
  };
  weights: {
    resolution: number;
    blur: number;
    glare: number;
    textVisibility: number;
  };
  blockingRules: {
    failOnLowResolution: boolean;
    failOnHighBlur: boolean;
    failOnHighGlare: boolean;
    failOnNoText: boolean;
  };
}

export const defaultQualityPolicy: QualityPolicyConfig = {
  thresholds: {
    minWidth: 720,
    minHeight: 720,
    minBlurVariance: 100, // Lower means blurrier
    maxGlareRatio: 0.15, // 15% of image is overexposed
    minTextContrast: 30, // Heuristic measure
  },
  weights: {
    resolution: 20,
    blur: 40,
    glare: 20,
    textVisibility: 20,
  },
  blockingRules: {
    failOnLowResolution: true,
    failOnHighBlur: true,
    failOnHighGlare: false, // We'll warn mostly, unless extremely high
    failOnNoText: false,
  }
};
