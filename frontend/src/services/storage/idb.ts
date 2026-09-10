export const DB_NAME = 'InspectMate_OfflineDB_v1';
export const DB_VERSION = 1;

export const STORES = {
  MEDIA_BLOBS: 'media_blobs',
  EVIDENCE_METADATA: 'evidence_metadata',
  SYNC_QUEUE: 'sync_queue',
  ID_MAPPINGS: 'id_mappings',
  SYNC_EVENTS: 'sync_events'
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Media Blobs Store (Large binaries)
      if (!db.objectStoreNames.contains(STORES.MEDIA_BLOBS)) {
        db.createObjectStore(STORES.MEDIA_BLOBS, { keyPath: 'id' });
      }

      // 2. Evidence Metadata Store
      if (!db.objectStoreNames.contains(STORES.EVIDENCE_METADATA)) {
        const evidenceStore = db.createObjectStore(STORES.EVIDENCE_METADATA, { keyPath: 'clientEvidenceId' });
        evidenceStore.createIndex('inspectionId', 'inspectionId', { unique: false });
        evidenceStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        evidenceStore.createIndex('userId', 'userId', { unique: false });
        evidenceStore.createIndex('slotId', 'slotId', { unique: false });
        evidenceStore.createIndex('user_inspection', ['userId', 'inspectionId'], { unique: false });
      }

      // 3. Persistent Sync Queue Store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'jobId' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('nextAttemptAt', 'nextAttemptAt', { unique: false });
        queueStore.createIndex('priority', 'priority', { unique: false });
        queueStore.createIndex('dedupeKey', 'dedupeKey', { unique: true });
        queueStore.createIndex('userId', 'userId', { unique: false });
      }

      // 4. ID Mappings (Local ID -> Server ID)
      if (!db.objectStoreNames.contains(STORES.ID_MAPPINGS)) {
        db.createObjectStore(STORES.ID_MAPPINGS, { keyPath: 'localReference' });
      }

      // 5. Local Sync Events
      if (!db.objectStoreNames.contains(STORES.SYNC_EVENTS)) {
        const eventStore = db.createObjectStore(STORES.SYNC_EVENTS, { keyPath: 'id', autoIncrement: true });
        eventStore.createIndex('inspectionId', 'inspectionId', { unique: false });
        eventStore.createIndex('userId', 'userId', { unique: false });
        eventStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Resets the database connection (used for testing or migration)
 */
export function resetDbConnection(): void {
  dbPromise = null;
}
