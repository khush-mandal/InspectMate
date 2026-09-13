/**
 * Manages client-side idempotency keys for evidence sync and upload operations.
 */
export class IdempotencyKeyManager {
  /**
   * Generates a stable, unique idempotency key for an evidence upload task.
   * If an existing key is provided (e.g. from an existing job), it can be preserved across retries.
   */
  static generateKey(inspectionId: string, clientEvidenceId: string, attemptCount = 0): string {
    const safeInspection = (inspectionId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeEvidence = (clientEvidenceId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    // Stable per entity attempt or stable per entity
    return `idemp_${safeInspection}_${safeEvidence}`;
  }

  /**
   * Generates a unique UUID-backed idempotency key when strict one-shot semantics are preferred.
   */
  static generateUuidKey(): string {
    return `idemp_${crypto.randomUUID()}`;
  }
}
