import { BaseRepository } from './BaseRepository';
import { Inspection, IInspection } from '../models/Inspection';
import { ClientSession } from 'mongoose';

export class InspectionRepository extends BaseRepository<IInspection> {
  constructor() {
    super(Inspection);
  }

  async findByClientReference(clientReference: string, lean = true): Promise<IInspection | null> {
    return this.findOne({ clientReference }, lean);
  }

  async incrementEvidenceCount(id: string, session?: ClientSession): Promise<void> {
    await this.model.updateOne({ _id: id }, { $inc: { evidenceCount: 1 } }, { session }).exec();
  }

  async incrementFindingCount(id: string, session?: ClientSession): Promise<void> {
    await this.model.updateOne({ _id: id }, { $inc: { findingCount: 1 } }, { session }).exec();
  }
}

export const inspectionRepository = new InspectionRepository();
