import { ApiError } from '../evidenceApi.service';

export interface EvaluationInput {
  mrp?: string | null;
  netQuantity?: string | null;
  manufacturer?: string | null;
  dateInfo?: string | null;
  consumerCare?: string | null;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  field: string;
  passed: boolean;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface VerificationResponse {
  finalStatus: 'VERIFIED' | 'POTENTIAL_VIOLATION';
  ruleResults: RuleEvaluationResult[];
}

export class RulesApiClient {
  static async verify(data: EvaluationInput): Promise<VerificationResponse> {
    let authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new ApiError('Failed to run rules engine verification', response.status);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid server response');
      }

      return result.data as VerificationResponse;
    } catch (error) {
      console.error('Rules Engine API error:', error);
      throw error;
    }
  }
}
