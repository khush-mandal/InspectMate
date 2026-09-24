import { 
  FinalDecisionState, 
  FieldReviewAction, 
  ViolationReviewAction, 
  ReviewableField, 
  ReviewableViolation,
  InspectorDecision
} from '../types/domain.types';
import { getApiUrl } from '../config/api';

export interface ReviewBundleResponse {
  inspection: any;
  evidence: any[];
  ocrResults: any[];
  barcodeResults: any[];
  verificationResults: any[];
  extractedFields: ReviewableField[];
  violations: ReviewableViolation[];
  regulations: Array<{
    code: string;
    act: string;
    section: string;
    title: string;
    summary: string;
  }>;
  detectedConflicts: Array<{
    id: string;
    field: string;
    sourceA: { name: string; value: string };
    sourceB: { name: string; value: string };
    conflictType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: string;
  }>;
  decisionHistory: InspectorDecision[];
  auditLogs: any[];
}

class InspectionReviewService {
  private getHeaders(): Record<string, string> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async getReviewBundle(inspectionId: string): Promise<ReviewBundleResponse> {
    const res = await fetch(getApiUrl(`/api/inspections/${inspectionId}/review`), {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch review bundle (${res.status})`);
    }

    const data = await res.json();
    return data.data;
  }

  async updateFieldReview(
    inspectionId: string,
    payload: {
      fieldId: string;
      action: FieldReviewAction;
      inspectorValue?: string;
      reason?: string;
      notes?: string;
    }
  ): Promise<{ field: ReviewableField; allFields: ReviewableField[] }> {
    const res = await fetch(getApiUrl(`/api/inspections/${inspectionId}/field-review`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update field review (${res.status})`);
    }

    return await res.json();
  }

  async updateViolationReview(
    inspectionId: string,
    payload: {
      violationId: string;
      action: ViolationReviewAction;
      overrideReason?: string;
    }
  ): Promise<{ violation: ReviewableViolation; allViolations: ReviewableViolation[] }> {
    const res = await fetch(getApiUrl(`/api/inspections/${inspectionId}/violation-review`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update violation review (${res.status})`);
    }

    return await res.json();
  }

  async submitFinalDecision(
    inspectionId: string,
    payload: {
      decision: FinalDecisionState;
      reason: string;
      changedFields?: any[];
      violationDecisions?: any[];
    }
  ): Promise<{ success: boolean; decision: InspectorDecision; inspection: any }> {
    const res = await fetch(getApiUrl(`/api/inspections/${inspectionId}/decision`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to submit final decision (${res.status})`);
    }

    return await res.json();
  }

  async attachAdditionalEvidence(
    inspectionId: string,
    payload: {
      storageKey?: string;
      localFilePath?: string;
      captureSide?: string;
      mimeType?: string;
      fileSize?: number;
      sha256Hash?: string;
      qualityScore?: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; evidence: any; evidenceCount: number }> {
    const res = await fetch(getApiUrl(`/api/inspections/${inspectionId}/additional-evidence`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to attach additional evidence (${res.status})`);
    }

    return await res.json();
  }

  async getAuditTrail(inspectionId: string): Promise<{ logs: any[]; decisions: InspectorDecision[] }> {
    const res = await fetch(getApiUrl(`/api/inspections/${inspectionId}/audit-trail`), {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch audit trail (${res.status})`);
    }

    const data = await res.json();
    return data.data;
  }
}

export const inspectionReviewService = new InspectionReviewService();
