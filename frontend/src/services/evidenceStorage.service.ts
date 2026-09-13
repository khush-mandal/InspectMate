import { LocalEvidenceRecord } from '../types/capture.types';
import { localEvidenceStore } from './storage/LocalEvidenceStore';
import { evidenceRepository } from './EvidenceRepository';

export const saveEvidenceLocally = async (item: LocalEvidenceRecord): Promise<void> => {
  await localEvidenceStore.saveEvidence(item);
};

export const getEvidenceForInspection = async (inspectionId: string, userId = 'guest'): Promise<LocalEvidenceRecord[]> => {
  return await localEvidenceStore.listEvidenceForInspection(inspectionId, userId);
};

export const deleteEvidenceLocally = async (clientEvidenceId: string): Promise<void> => {
  await evidenceRepository.removeEvidence(clientEvidenceId);
};

