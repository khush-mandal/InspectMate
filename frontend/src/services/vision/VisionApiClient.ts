import { ApiError } from '../evidenceApi.service';

export interface VisionExtractedFields {
  mrp: string | null;
  netQuantity: string | null;
  manufacturer: string | null;
  dateInfo: string | null;
  consumerCare: string | null;
}

export class VisionApiClient {
  static async extractFields(imageBlob: Blob): Promise<VisionExtractedFields> {
    const formData = new FormData();
    formData.append('image', imageBlob, 'capture.jpg');

    let authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch('/api/extract/vision', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new ApiError('Failed to extract via vision API', response.status);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid server response');
      }

      return result.data as VisionExtractedFields;
    } catch (error) {
      console.error('Vision API Extraction error:', error);
      throw error;
    }
  }
}
