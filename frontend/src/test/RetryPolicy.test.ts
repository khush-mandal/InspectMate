import { describe, it, expect } from 'vitest';
import { RetryPolicy } from '../services/sync/RetryPolicy';

describe('RetryPolicy', () => {
  const policy = new RetryPolicy({
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    maxAttempts: 5,
    backoffFactor: 2
  });

  it('calculates exponential backoff with jitter within expected bounds', () => {
    // Attempt 0: base 1000ms -> [700, 1300]ms
    const delay0 = policy.calculateNextRetryDelay(0);
    expect(delay0).toBeGreaterThanOrEqual(700);
    expect(delay0).toBeLessThanOrEqual(1300);

    // Attempt 1: base 2000ms -> [1400, 2600]ms
    const delay1 = policy.calculateNextRetryDelay(1);
    expect(delay1).toBeGreaterThanOrEqual(1400);
    expect(delay1).toBeLessThanOrEqual(2600);

    // Attempt 2: base 4000ms -> [2800, 5200]ms
    const delay2 = policy.calculateNextRetryDelay(2);
    expect(delay2).toBeGreaterThanOrEqual(2800);
    expect(delay2).toBeLessThanOrEqual(5200);

    // High attempt capped at maxDelay (30000ms) -> [21000, 39000]ms
    const delayHigh = policy.calculateNextRetryDelay(10);
    expect(delayHigh).toBeGreaterThanOrEqual(21000);
    expect(delayHigh).toBeLessThanOrEqual(39000);
  });

  it('correctly classifies HTTP status codes', () => {
    const authError = policy.classifyError(new Error(), 401);
    expect(authError.category).toBe('AUTHENTICATION');
    expect(authError.retryable).toBe(true);

    const forbiddenError = policy.classifyError(new Error(), 403);
    expect(forbiddenError.category).toBe('AUTHORIZATION');
    expect(forbiddenError.retryable).toBe(false);

    const validationError = policy.classifyError(new Error(), 422);
    expect(validationError.category).toBe('VALIDATION');
    expect(validationError.retryable).toBe(false);

    const notFoundError = policy.classifyError(new Error(), 404);
    expect(notFoundError.category).toBe('NON_RETRYABLE');
    expect(notFoundError.retryable).toBe(false);

    const serverError = policy.classifyError(new Error(), 503);
    expect(serverError.category).toBe('SERVER');
    expect(serverError.retryable).toBe(true);
  });

  it('correctly classifies network and storage error types', () => {
    const timeoutErr = policy.classifyError(new Error('Connection timed out'));
    expect(timeoutErr.category).toBe('TIMEOUT');
    expect(timeoutErr.retryable).toBe(true);

    const missingFileErr = policy.classifyError(new Error('LOCAL_FILE_MISSING: blob deleted'));
    expect(missingFileErr.category).toBe('FILE_NOT_FOUND');
    expect(missingFileErr.retryable).toBe(false);

    const integrityErr = policy.classifyError(new Error('INTEGRITY_FAILURE: hash mismatch'));
    expect(integrityErr.category).toBe('INTEGRITY_FAILURE');
    expect(integrityErr.retryable).toBe(false);
  });

  it('enforces maximum retry limits', () => {
    const retryableError = {
      category: 'SERVER' as const,
      code: 'HTTP_500',
      message: 'Server error',
      retryable: true
    };

    expect(policy.shouldRetry(0, retryableError)).toBe(true);
    expect(policy.shouldRetry(4, retryableError)).toBe(true);
    expect(policy.shouldRetry(5, retryableError)).toBe(false);
    expect(policy.shouldRetry(6, retryableError)).toBe(false);

    const nonRetryableError = {
      category: 'VALIDATION' as const,
      code: 'INVALID_PAYLOAD',
      message: 'Validation failed',
      retryable: false
    };

    expect(policy.shouldRetry(0, nonRetryableError)).toBe(false);
  });
});
