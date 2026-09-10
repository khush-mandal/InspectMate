import { openDatabase, STORES } from './idb';
import { LocalEvidenceRecord, SyncStatus, SyncErrorCategory } from '../../types/capture.types';

export class LocalEvidenceStore {
  async saveEvidence(record: LocalEvidenceRecord): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVIDENCE_METADATA, 'readwrite');
      const store = tx.objectStore(STORES.EVIDENCE_METADATA);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to save evidence metadata'));
    });
  }

  async getEvidence(clientEvidenceId: string): Promise<LocalEvidenceRecord | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVIDENCE_METADATA, 'readonly');
      const store = tx.objectStore(STORES.EVIDENCE_METADATA);
      const req = store.get(clientEvidenceId);

      req.onsuccess = () => resolve((req.result as LocalEvidenceRecord) || null);
      req.onerror = () => reject(req.error || new Error('Failed to get evidence metadata'));
    });
  }

  async listEvidenceForInspection(inspectionId: string, userId: string): Promise<LocalEvidenceRecord[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVIDENCE_METADATA, 'readonly');
      const store = tx.objectStore(STORES.EVIDENCE_METADATA);
      const index = store.index('inspectionId');
      const req = index.getAll(inspectionId);

      req.onsuccess = () => {
        const records = (req.result as LocalEvidenceRecord[]) || [];
        // Apply strict account isolation
        const userRecords = records.filter(r => r.userId === userId && r.isActive);
        resolve(userRecords);
      };
      req.onerror = () => reject(req.error || new Error('Failed to list evidence'));
    });
  }

  async listPendingSyncEvidence(userId: string): Promise<LocalEvidenceRecord[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVIDENCE_METADATA, 'readonly');
      const store = tx.objectStore(STORES.EVIDENCE_METADATA);
      const index = store.index('syncStatus');
      const req = index.getAll('SYNC_PENDING');

      req.onsuccess = () => {
        const records = (req.result as LocalEvidenceRecord[]) || [];
        resolve(records.filter(r => r.userId === userId && r.isActive));
      };
      req.onerror = () => reject(req.error || new Error('Failed to list pending evidence'));
    });
  }

  async updateSyncStatus(
    clientEvidenceId: string,
    syncStatus: SyncStatus,
    extraUpdates: Partial<LocalEvidenceRecord> = {}
  ): Promise<LocalEvidenceRecord | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVIDENCE_METADATA, 'readwrite');
      const store = tx.objectStore(STORES.EVIDENCE_METADATA);
      const getReq = store.get(clientEvidenceId);

      getReq.onsuccess = () => {
        const record = getReq.result as LocalEvidenceRecord | undefined;
        if (!record) {
          resolve(null);
          return;
        }

        const updated: LocalEvidenceRecord = {
          ...record,
          syncStatus,
          ...extraUpdates
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async markSyncing(clientEvidenceId: string): Promise<void> {
    await this.updateSyncStatus(clientEvidenceId, 'SYNCING', {
      lastAttemptAt: Date.now()
    });
  }

  async markSynced(
    clientEvidenceId: string, 
    serverEvidenceId: string, 
    serverUploadedAt?: string
  ): Promise<void> {
    await this.updateSyncStatus(clientEvidenceId, 'SYNCED', {
      serverEvidenceId,
      serverUploadedAt: serverUploadedAt || new Date().toISOString(),
      lastAttemptAt: Date.now(),
      lastErrorCode: undefined,
      lastErrorMessage: undefined,
      lastErrorCategory: undefined
    });
  }

  async markSyncFailed(
    clientEvidenceId: string,
    error: {
      category: SyncErrorCategory;
      code: string;
      message: string;
      retryable: boolean;
    },
    nextRetryAt?: number
  ): Promise<void> {
    const existing = await this.getEvidence(clientEvidenceId);
    const attempts = (existing?.uploadAttempts || 0) + 1;

    await this.updateSyncStatus(clientEvidenceId, 'SYNC_FAILED', {
      uploadAttempts: attempts,
      lastAttemptAt: Date.now(),
      nextRetryAt,
      lastErrorCategory: error.category,
      lastErrorCode: error.code,
      lastErrorMessage: error.message
    });
  }

  async markSyncPending(clientEvidenceId: string): Promise<void> {
    await this.updateSyncStatus(clientEvidenceId, 'SYNC_PENDING');
  }

  async supersedeEvidence(oldClientEvidenceId: string, newClientEvidenceId: string): Promise<void> {
    const oldRecord = await this.getEvidence(oldClientEvidenceId);
    if (oldRecord) {
      await this.updateSyncStatus(oldClientEvidenceId, oldRecord.syncStatus, {
        isActive: false
      });
    }
    const newRecord = await this.getEvidence(newClientEvidenceId);
    if (newRecord) {
      await this.updateSyncStatus(newClientEvidenceId, newRecord.syncStatus, {
        supersedesClientEvidenceId: oldClientEvidenceId
      });
    }
  }

  async deleteEvidence(clientEvidenceId: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVIDENCE_METADATA, 'readwrite');
      const store = tx.objectStore(STORES.EVIDENCE_METADATA);
      const req = store.delete(clientEvidenceId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Startup Crash Recovery: Reconciles records that were left in SYNCING state without server confirmation
   */
  async reconcileStartupStates(userId: string): Promise<{ resetSyncingCount: number }> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVIDENCE_METADATA, 'readwrite');
      const store = tx.objectStore(STORES.EVIDENCE_METADATA);
      const index = store.index('syncStatus');
      const req = index.getAll('SYNCING');

      req.onsuccess = () => {
        const records = (req.result as LocalEvidenceRecord[]) || [];
        let count = 0;
        records.forEach(r => {
          if (r.userId === userId && !r.serverEvidenceId) {
            r.syncStatus = 'SYNC_PENDING';
            store.put(r);
            count++;
          }
        });
        resolve({ resetSyncingCount: count });
      };

      req.onerror = () => reject(req.error);
    });
  }
}

export const localEvidenceStore = new LocalEvidenceStore();
