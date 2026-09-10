import { LocalEvidenceRecord } from '../types/capture.types';
import { localEvidenceStore } from './storage/LocalEvidenceStore';
import { mediaBlobStore } from './storage/MediaBlobStore';

export const saveEvidenceLocally = async (item: LocalEvidenceRecord): Promise<void> => {
  await localEvidenceStore.saveEvidence(item);
};

export const getEvidenceForInspection = async (inspectionId: string, userId = 'guest'): Promise<LocalEvidenceRecord[]> => {
  return await localEvidenceStore.listEvidenceForInspection(inspectionId, userId);
};

export const deleteEvidenceLocally = async (clientEvidenceId: string): Promise<void> => {
  const record = await localEvidenceStore.getEvidence(clientEvidenceId);
  if (record) {
    await mediaBlobStore.deleteBlob(record.localMediaId);
  }
  await localEvidenceStore.deleteEvidence(clientEvidenceId);
};
