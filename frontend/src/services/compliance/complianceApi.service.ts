export type StatutoryOutcome = 'VERIFIED' | 'POTENTIAL VIOLATION' | 'INCONSISTENT' | 'INSUFFICIENT EVIDENCE';

export interface RuleFindingItem {
  ruleId: string;
  ruleName: string;
  ruleReference: string;
  ruleVersion: string;
  field: string;
  passed: boolean;
  confidence: number;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StatutoryComplianceResponse {
  finalStatus: StatutoryOutcome;
  statusDescription: string;
  ruleResults: RuleFindingItem[];
  category: string;
  isEdible: boolean;
}

export class ComplianceApiClient {
  static async evaluateDeclarations(payload: Record<string, any>): Promise<StatutoryComplianceResponse> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to evaluate compliance: HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to verify compliance rules');
      }

      return json.data as StatutoryComplianceResponse;
    } catch (error) {
      console.error('Compliance evaluation error:', error);
      throw error;
    }
  }
}
