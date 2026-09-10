import { SyncErrorCategory } from '../../types/capture.types';

export interface ClassifiedError {
  category: SyncErrorCategory;
  code: string;
  message: string;
  retryable: boolean;
}

export class RetryPolicy {
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly maxAttempts: number;
  readonly backoffFactor: number;

  constructor(options?: {
    initialDelayMs?: number;
    maxDelayMs?: number;
    maxAttempts?: number;
    backoffFactor?: number;
  }) {
    this.initialDelayMs = options?.initialDelayMs ?? 1_000;
    this.maxDelayMs = options?.maxDelayMs ?? 30_000;
    this.maxAttempts = options?.maxAttempts ?? 5;
    this.backoffFactor = options?.backoffFactor ?? 2;
  }

  calculateNextRetryDelay(attemptCount: number): number {
    const exponent = Math.min(attemptCount, 10);
    const baseDelay = this.initialDelayMs * Math.pow(this.backoffFactor, exponent);
    const cappedDelay = Math.min(baseDelay, this.maxDelayMs);
    // Add randomized jitter between 70% and 130% of calculated delay
    const jitterMultiplier = 0.7 + Math.random() * 0.6;
    return Math.round(cappedDelay * jitterMultiplier);
  }

  shouldRetry(attemptCount: number, error: ClassifiedError): boolean {
    if (!error.retryable) return false;
    return attemptCount < this.maxAttempts;
  }

  classifyError(error: unknown, statusCode?: number): ClassifiedError {
    if (statusCode !== undefined) {
      if (statusCode === 401) {
        return {
          category: 'AUTHENTICATION',
          code: 'UNAUTHENTICATED',
          message: 'Session expired or authentication required.',
          retryable: true
        };
      }
      if (statusCode === 403) {
        return {
          category: 'AUTHORIZATION',
          code: 'FORBIDDEN',
          message: 'Not authorized to perform this synchronization action.',
          retryable: false
        };
      }
      if (statusCode === 400 || statusCode === 422) {
        return {
          category: 'VALIDATION',
          code: 'INVALID_PAYLOAD',
          message: (error as any)?.message || 'Evidence metadata failed server validation.',
          retryable: false
        };
      }
      if (statusCode === 404) {
        return {
          category: 'NON_RETRYABLE',
          code: 'NOT_FOUND',
          message: (error as any)?.message || 'Target inspection or resource not found on server.',
          retryable: false
        };
      }
      if (statusCode === 409) {
        return {
          category: 'CONFLICT',
          code: 'CONFLICT',
          message: 'Conflict with existing server record.',
          retryable: false
        };
      }
      if (statusCode >= 500) {
        return {
          category: 'SERVER',
          code: `HTTP_${statusCode}`,
          message: 'InspectMate server error during upload.',
          retryable: true
        };
      }
    }

    const isErrorObj = error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error);
    if (isErrorObj) {
      const errObj = error as { name?: string; message?: string };
      const name = (errObj.name || '').toLowerCase();
      const msg = (errObj.message || '').toLowerCase();

      if (name === 'aborterror' || msg.includes('timeout') || msg.includes('timed out')) {
        return {
          category: 'TIMEOUT',
          code: 'REQUEST_TIMEOUT',
          message: 'Network request timed out.',
          retryable: true
        };
      }

      if (msg.includes('local_file_missing')) {
        return {
          category: 'FILE_NOT_FOUND',
          code: 'LOCAL_FILE_MISSING',
          message: 'Locally captured media file is missing from storage.',
          retryable: false
        };
      }

      if (msg.includes('integrity_failure')) {
        return {
          category: 'INTEGRITY_FAILURE',
          code: 'SHA256_MISMATCH',
          message: 'Computed SHA-256 hash mismatch.',
          retryable: false
        };
      }

      if (msg.includes('network') || msg.includes('failed to fetch')) {
        return {
          category: 'NETWORK',
          code: 'NETWORK_ERROR',
          message: 'Network unreachable or connection lost.',
          retryable: true
        };
      }
    }

    return {
      category: 'UNKNOWN',
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown synchronization error',
      retryable: true
    };
  }
}

export const defaultRetryPolicy = new RetryPolicy();
