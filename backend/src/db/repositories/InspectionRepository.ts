import { BaseRepository } from './BaseRepository';
import { Inspection, IInspection } from '../models/Inspection';
import mongoose, { ClientSession } from 'mongoose';

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

  async getDashboardStats(inspectorId: string) {
    const objectId = new mongoose.Types.ObjectId(inspectorId);
    
    const [summary, recentInspections] = await Promise.all([
      this.model.aggregate([
        { $match: { inspector: objectId } },
        {
          $group: {
            _id: null,
            totalInspections: { $sum: 1 },
            pendingReview: {
              $sum: { $cond: [{ $eq: ['$lifecycleStatus', 'AWAITING_REVIEW'] }, 1, 0] }
            },
            potentialViolations: {
              $sum: { $cond: [{ $eq: ['$finalStatus', 'POTENTIAL_VIOLATION'] }, 1, 0] }
            },
            verified: {
              $sum: { $cond: [{ $eq: ['$finalStatus', 'VERIFIED'] }, 1, 0] }
            }
          }
        }
      ]),
      this.model.find({ inspector: objectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec()
    ]);

    return {
      summary: summary[0] || {
        totalInspections: 0,
        pendingReview: 0,
        potentialViolations: 0,
        verified: 0
      },
      recentInspections
    };
  }
}

export const inspectionRepository = new InspectionRepository();
