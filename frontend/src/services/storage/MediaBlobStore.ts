import { openDatabase, STORES } from './idb';

interface StoredBlobRecord {
  id: string; // localMediaId
  data: ArrayBuffer;
  mimeType: string;
  size: number;
  createdAt: number;
}

export class MediaBlobStore {
  private activeObjectUrls: Set<string> = new Set();

  async saveBlob(id: string, fileOrBlob: Blob | File): Promise<void> {
    const buffer = await fileOrBlob.arrayBuffer();
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA_BLOBS, 'readwrite');
      const store = tx.objectStore(STORES.MEDIA_BLOBS);

      const record: StoredBlobRecord = {
        id,
        data: buffer,
        mimeType: fileOrBlob.type || 'application/octet-stream',
        size: fileOrBlob.size,
        createdAt: Date.now()
      };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to save media blob'));
    });
  }

  async getBlob(id: string): Promise<Blob | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA_BLOBS, 'readonly');
      const store = tx.objectStore(STORES.MEDIA_BLOBS);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as StoredBlobRecord | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        if (record.data) {
          const blob = new Blob([record.data], { type: record.mimeType });
          resolve(blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error || new Error('Failed to retrieve media blob'));
    });
  }

  async hasBlob(id: string): Promise<boolean> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA_BLOBS, 'readonly');
      const store = tx.objectStore(STORES.MEDIA_BLOBS);
      const req = store.count(IDBKeyRange.only(id));

      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBlob(id: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA_BLOBS, 'readwrite');
      const store = tx.objectStore(STORES.MEDIA_BLOBS);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to delete media blob'));
    });
  }

  async createPreviewUrl(id: string): Promise<string | null> {
    const blob = await this.getBlob(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    this.activeObjectUrls.add(url);
    return url;
  }

  revokePreviewUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      this.activeObjectUrls.delete(url);
    }
  }

  revokeAllPreviewUrls(): void {
    this.activeObjectUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.activeObjectUrls.clear();
  }

  async calculateStorageUsage(): Promise<{ count: number; totalBytes: number }> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA_BLOBS, 'readonly');
      const store = tx.objectStore(STORES.MEDIA_BLOBS);
      const req = store.openCursor();
      let count = 0;
      let totalBytes = 0;

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          count++;
          const record = cursor.value as StoredBlobRecord;
          if (record && record.size) {
            totalBytes += record.size;
          }
          cursor.continue();
        } else {
          resolve({ count, totalBytes });
        }
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const mediaBlobStore = new MediaBlobStore();
