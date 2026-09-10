import { describe, it, expect } from 'vitest';
import { calculateFileSha256, calculateBufferSha256 } from '../utils/crypto.utils';

describe('crypto.utils', () => {
  it('computes correct SHA-256 hash for known byte buffer', async () => {
    // "hello world" in UTF-8 -> b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
    const encoder = new TextEncoder();
    const data = encoder.encode('hello world');
    const hash = await calculateBufferSha256(data.buffer);

    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('computes correct SHA-256 hash from Blob/File object', async () => {
    const blob = new Blob(['InspectMate Field Evidence Data'], { type: 'text/plain' });
    const hash = await calculateFileSha256(blob);

    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // 32 bytes in hex = 64 characters
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });

  it('produces identical hash for identical bytes and different hash for modified bytes', async () => {
    const fileA = new File(['evidence-image-data-payload-1'], 'front.jpg', { type: 'image/jpeg' });
    const fileB = new File(['evidence-image-data-payload-1'], 'different_name.jpg', { type: 'image/jpeg' });
    const fileC = new File(['evidence-image-data-payload-2'], 'front.jpg', { type: 'image/jpeg' });

    const hashA = await calculateFileSha256(fileA);
    const hashB = await calculateFileSha256(fileB);
    const hashC = await calculateFileSha256(fileC);

    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(hashC);
  });
});
