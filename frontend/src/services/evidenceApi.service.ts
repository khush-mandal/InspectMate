import { LocalEvidenceRecord } from '../types/capture.types';
import { getApiUrl } from '../config/api';

export interface EvidenceUploadResponse {
  serverEvidenceId: string;
  inspectionId: string;
  clientEvidenceId: string;
  sha256Hash: string;
  uploadedAt: string;
  syncStatus: 'SYNCED';
  isIdempotentReplay?: boolean;
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
  timeoutMs = 30_000,
  idempotencyKey?: string
): Promise<EvidenceUploadResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const activeIdempKey = idempotencyKey || `idemp_${item.inspectionId}_${item.clientEvidenceId}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Idempotency-Key': activeIdempKey
    };

    let authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const payload = {
      inspectionId: item.inspectionId,
      clientEvidenceId: item.clientEvidenceId,
      clientRequestId: item.id,
      idempotencyKey: activeIdempKey,
      localFileId: item.localFileId,
      evidenceType: item.mode === 'VIDEO' ? 'VIDEO' : 'PHOTO',
      captureSide: item.slotId || 'UNKNOWN',
      sha256Hash: item.sha256,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      capturedAt: item.capturedAt,
      dimensions: item.width && item.height ? { width: item.width, height: item.height } : undefined,
      videoDuration: item.durationMs ? Math.round(item.durationMs / 1000) : undefined
    };

    let response = await fetch(getApiUrl('/api/evidence'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    // Automatic silent token refresh on 401
    if (response.status === 401 && typeof localStorage !== 'undefined') {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        try {
          const refreshRes = await fetch(getApiUrl('/api/auth/refresh'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedRefreshToken })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.accessToken) {
              localStorage.setItem('accessToken', refreshData.accessToken);
              authToken = refreshData.accessToken;
              headers['Authorization'] = `Bearer ${authToken}`;

              // Retry upload with refreshed token
              response = await fetch(getApiUrl('/api/evidence'), {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
              });
            }
          }
        } catch {
          // Fall through to standard error handling if refresh fails
        }
      }
    }

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
      syncStatus: 'SYNCED',
      isIdempotentReplay: Boolean(result.data.isIdempotentReplay)
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Upload request timed out', 408);
    }
    throw error;
  }
};
