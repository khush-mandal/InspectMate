import { EvidenceItem } from '../types/capture.types';

const DB_NAME = 'InspectMateEvidenceDB';
const DB_VERSION = 1;
const STORE_NAME = 'evidence';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'evidenceId' });
      }
    };
  });
};

export const saveEvidenceLocally = async (item: EvidenceItem): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Convert File/Blob to store in IndexedDB if necessary. 
    // In many modern browsers, File objects can be stored directly.
    const request = store.put(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getEvidenceForInspection = async (inspectionId: string): Promise<EvidenceItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const allEvidence: EvidenceItem[] = request.result || [];
      resolve(allEvidence.filter(e => e.inspectionId === inspectionId));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteEvidenceLocally = async (evidenceId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(evidenceId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
