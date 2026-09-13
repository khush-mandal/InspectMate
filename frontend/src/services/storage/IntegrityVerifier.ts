import { mediaBlobStore } from './MediaBlobStore';
import { calculateBufferSha256 } from '../../utils/crypto.utils';

export interface IntegrityVerificationResult {
  valid: boolean;
  actualSha256?: string;
  expectedSha256: string;
  error?: string;
}

export class IntegrityVerifier {
  /**
   * Verifies the SHA-256 integrity of locally stored media binary against the expected hash.
   * Protects against local IndexedDB data corruption and truncated writes.
   */
  async verifyBlobIntegrity(
    localMediaId: string,
    expectedSha256: string
  ): Promise<IntegrityVerificationResult> {
    const cleanExpected = (expectedSha256 || '').trim().toLowerCase();

    const blob = await mediaBlobStore.getBlob(localMediaId);
    if (!blob) {
      return {
        valid: false,
        expectedSha256: cleanExpected,
        error: 'LOCAL_FILE_MISSING: Media binary not found in storage'
      };
    }

    try {
      const buffer = await blob.arrayBuffer();
      if (buffer.byteLength === 0 && cleanExpected !== 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') {
        return {
          valid: false,
          expectedSha256: cleanExpected,
          actualSha256: '',
          error: 'ZERO_BYTE_CORRUPTION: Stored media blob is zero bytes'
        };
      }

      const actualSha256 = (await calculateBufferSha256(buffer)).toLowerCase();
      const valid = actualSha256 === cleanExpected;

      return {
        valid,
        actualSha256,
        expectedSha256: cleanExpected,
        error: valid ? undefined : `SHA256_MISMATCH: Expected ${cleanExpected}, got ${actualSha256}`
      };
    } catch (err: any) {
      return {
        valid: false,
        expectedSha256: cleanExpected,
        error: `INTEGRITY_COMPUTATION_ERROR: ${err?.message || 'Failed to compute hash'}`
      };
    }
  }
}

export const integrityVerifier = new IntegrityVerifier();
