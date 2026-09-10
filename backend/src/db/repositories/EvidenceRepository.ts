import { BaseRepository } from './BaseRepository';
import { Evidence, IEvidence } from '../models/Evidence';
import { Types } from 'mongoose';

export class EvidenceRepository extends BaseRepository<IEvidence> {
  constructor() {
    super(Evidence);
  }

  async findByStorageKey(storageKey: string, lean = true): Promise<IEvidence | null> {
    return this.findOne({ storageKey }, lean);
  }

  async findBySha256AndInspection(inspectionId: string, sha256Hash: string, lean = true): Promise<IEvidence | null> {
    return this.findOne({
      inspection: new Types.ObjectId(inspectionId),
      sha256Hash
    }, lean);
  }

  async listByInspection(inspectionId: string, lean = true): Promise<IEvidence[]> {
    const result = await this.find({
      inspection: new Types.ObjectId(inspectionId)
    }, { limit: 100 }, lean);
    return result.data;
  }
}

export const evidenceRepository = new EvidenceRepository();
