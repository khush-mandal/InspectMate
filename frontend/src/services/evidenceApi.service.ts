import { LocalEvidenceRecord } from '../types/capture.types';

export interface EvidenceUploadResponse {
  serverEvidenceId: string;
  inspectionId: string;
  clientEvidenceId: string;
  sha256Hash: string;
  uploadedAt: string;
  syncStatus: 'SYNCED';
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const uploadEvidenceAPI = async (
  item: LocalEvidenceRecord,
  token?: string | null,
  timeoutMs = 30_000
): Promise<EvidenceUploadResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const authToken = token || localStorage.getItem('accessToken');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const payload = {
      inspectionId: item.inspectionId,
      clientEvidenceId: item.clientEvidenceId,
      clientRequestId: item.id,
      evidenceType: item.mode === 'VIDEO' ? 'VIDEO' : 'PHOTO',
      captureSide: item.slotId || 'UNKNOWN',
      sha256Hash: item.sha256,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      capturedAt: item.capturedAt,
      dimensions: item.width && item.height ? { width: item.width, height: item.height } : undefined,
      videoDuration: item.durationMs ? Math.round(item.durationMs / 1000) : undefined
    };

    const response = await fetch('/api/evidence', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // ignore json parse error
      }
      const message = errorData.error || errorData.message || `Server responded with HTTP ${response.status}`;
      throw new ApiError(message, response.status, errorData);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new ApiError(result.error || 'Invalid server response structure', 500);
    }

    return {
      serverEvidenceId: result.data.serverEvidenceId || result.data.id,
      inspectionId: result.data.inspectionId,
      clientEvidenceId: result.data.clientEvidenceId || item.clientEvidenceId,
      sha256Hash: result.data.sha256Hash,
      uploadedAt: result.data.uploadedAt || new Date().toISOString(),
      syncStatus: 'SYNCED'
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Upload request timed out', 408);
    }
    throw error;
  }
};
