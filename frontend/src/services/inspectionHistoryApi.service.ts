import { InspectionRecord } from '../types';

export interface InspectionListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface InspectionListResponse {
  success: boolean;
  data: InspectionRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface RegulatoryAnalyticsData {
  kpis: {
    totalInspections: number;
    complianceRate: string;
    compliantCount: number;
    noticesIssued: number;
    inconclusiveCount: number;
    avgInspectionTimeMin: string;
  };
  topViolations: Array<{
    label: string;
    percent: number;
    count: number;
    color: string;
  }>;
  categoryCompliance: Array<{
    category: string;
    total: number;
    compliant: number;
    rate: string;
  }>;
  officers: Array<{
    name: string;
    badge: string;
    audits: number;
    accuracy: string;
  }>;
}

class InspectionHistoryApiService {
  private getHeaders(): Record<string, string> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async getInspections(params: InspectionListParams = {}): Promise<InspectionListResponse> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const url = `/api/inspections?${searchParams.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch inspections (${res.status})`);
    }

    const json = await res.json();
    return {
      success: json.success,
      data: (json.data || []).map((item: any) => ({
        id: item.id || item.clientReference || item._id,
        date: item.date || (item.createdAt ? item.createdAt.split('T')[0] : '2026-09-19'),
        time: item.time || '10:30 AM',
        inspectorName: item.inspectorName || 'Ashish Sainik',
        inspectorId: item.inspectorId || 'INS-DEL-742',
        retailerName: item.retailerName || 'Metro SuperMart Central',
        retailerAddress: item.retailerAddress || 'Sector 18 Commercial Hub, Noida, UP',
        city: item.city || 'Delhi-NCR',
        productName: item.productName || 'Packaged Commodity',
        category: item.category || 'Food & Groceries',
        manufacturer: item.manufacturer || 'Unspecified Manufacturer',
        gtin: item.gtin || '8901234567890',
        status: item.status || 'COMPLETED',
        classification: item.classification || 'VERIFIED',
        confidenceScore: item.confidenceScore || 92,
        findingsCount: item.findingsCount || 0,
        notes: item.notes || ''
      })),
      total: json.total || 0,
      page: json.page || 1,
      limit: json.limit || 50
    };
  }

  async getAnalytics(): Promise<RegulatoryAnalyticsData> {
    const res = await fetch('/api/inspections/analytics', {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch analytics (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  }

  async saveDossier(payload: {
    inspectionId?: string;
    productName?: string;
    gtin?: string;
    category?: string;
    manufacturer?: string;
    retailerName?: string;
    city?: string;
    declaredMrp?: string;
    declaredNetQuantity?: string;
    finalStatus?: string;
    decisionState?: string;
    adjudicationReason?: string;
    notes?: string;
    evidenceCount?: number;
    fieldReviews?: any[];
    violationReviews?: any[];
  }): Promise<{ success: boolean; data: any }> {
    const res = await fetch('/api/inspections/save-dossier', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to save inspection dossier (${res.status})`);
    }

    return await res.json();
  }
}

export const inspectionHistoryApi = new InspectionHistoryApiService();
