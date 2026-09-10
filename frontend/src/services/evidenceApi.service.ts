import { EvidenceItem } from '../types/capture.types';

export const uploadEvidenceAPI = async (item: EvidenceItem): Promise<{ serverEvidenceId: string }> => {
  // Simulate network delay and real upload
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 90% success rate
      if (Math.random() > 0.1) {
        resolve({
          serverEvidenceId: `srv_${item.evidenceId}`
        });
      } else {
        reject(new Error("Network upload failed."));
      }
    }, 1500);
  });
};
