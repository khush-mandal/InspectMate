import { BaseRepository } from './BaseRepository';
import { QualityAssessment, IQualityAssessment } from '../models/QualityAssessment';
import { Types } from 'mongoose';

export class QualityAssessmentRepository extends BaseRepository<IQualityAssessment> {
  constructor() {
    super(QualityAssessment);
  }

  async findByEvidenceId(evidenceId: string, lean = true): Promise<IQualityAssessment[]> {
    const result = await this.find({
      evidenceId: new Types.ObjectId(evidenceId)
    }, { limit: 10, sort: { processedAt: -1 } }, lean);
    return result.data;
  }
}

export const qualityAssessmentRepository = new QualityAssessmentRepository();
