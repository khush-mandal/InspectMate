import { describe, it, expect } from 'vitest';
import { mediaBlobStore } from '../services/storage/MediaBlobStore';

describe('MediaBlobStore', () => {
  it('saves, retrieves, and checks existence of binary media blobs', async () => {
    const blob = new Blob(['sample-binary-image-data'], { type: 'image/jpeg' });
    const mediaId = 'media_test_01';

    await mediaBlobStore.saveBlob(mediaId, blob);

    const exists = await mediaBlobStore.hasBlob(mediaId);
    expect(exists).toBe(true);

    const retrieved = await mediaBlobStore.getBlob(mediaId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.size).toBe(blob.size);
    expect(retrieved?.type).toBe('image/jpeg');
  });

  it('creates and manages object URLs safely', async () => {
    const blob = new Blob(['preview-data'], { type: 'image/jpeg' });
    const mediaId = 'media_preview_02';

    await mediaBlobStore.saveBlob(mediaId, blob);

    const url = await mediaBlobStore.createPreviewUrl(mediaId);
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');

    // Revocation does not throw
    expect(() => mediaBlobStore.revokePreviewUrl(url!)).not.toThrow();
  });

  it('calculates total media storage usage', async () => {
    const usage = await mediaBlobStore.calculateStorageUsage();
    expect(usage).toBeDefined();
    expect(typeof usage.count).toBe('number');
    expect(typeof usage.totalBytes).toBe('number');
    expect(usage.count).toBeGreaterThanOrEqual(1);
  });

  it('deletes media blob cleanly', async () => {
    const blob = new Blob(['to-delete'], { type: 'image/png' });
    const mediaId = 'media_delete_03';

    await mediaBlobStore.saveBlob(mediaId, blob);
    expect(await mediaBlobStore.hasBlob(mediaId)).toBe(true);

    await mediaBlobStore.deleteBlob(mediaId);
    expect(await mediaBlobStore.hasBlob(mediaId)).toBe(false);
  });
});
