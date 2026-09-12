import { Types } from 'mongoose';
import { evidenceRepository } from '../db/repositories/EvidenceRepository';
import { inspectionRepository } from '../db/repositories/InspectionRepository';
import { auditLogRepository } from '../db/repositories/AuditLogRepository';
import { qualityAssessmentRepository } from '../db/repositories/QualityAssessmentRepository';
import { IEvidence, EvidenceType, CaptureSide } from '../db/models/Evidence';
import { withTransaction } from '../db/transaction';
import { logger } from '../utils/logger';

export interface CreateEvidenceDTO {
  inspectorId: string;
  inspectionId: string;
  clientEvidenceId: string;
  clientRequestId?: string;
  evidenceType: EvidenceType;
  captureSide: CaptureSide;
  sha256Hash: string;
  mimeType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  videoDuration?: number;
  capturedAt: Date;
  storageProvider?: string;
  storageKey?: string;
  storageBucket?: string;
  qualityAssessment?: any;
}

export class EvidenceService {
  async createEvidence(data: CreateEvidenceDTO): Promise<IEvidence> {
    const inspection = await inspectionRepository.findById(data.inspectionId, false);
    if (!inspection) {
      throw new Error('Inspection not found');
    }

    if (inspection.inspector.toString() !== data.inspectorId) {
      throw new Error('Unauthorized: You can only upload evidence to your own inspection');
    }

    if (inspection.lifecycleStatus !== 'DRAFT' && inspection.lifecycleStatus !== 'PROCESSING') {
      throw new Error('Cannot upload evidence for completed or archived inspection');
    }

    const storageKey = data.storageKey || `ins_${data.inspectionId}/ev_${data.clientEvidenceId}`;

    // 1. Idempotency Check by storageKey / clientEvidenceId
    const existingByKey = await evidenceRepository.findByStorageKey(storageKey, false);
    if (existingByKey) {
      logger.info(`Idempotent evidence upload: returning existing record for key ${storageKey}`);
      return existingByKey;
    }

    // 2. Deduplication check by inspection + sha256Hash
    const existingByHash = await evidenceRepository.findBySha256AndInspection(data.inspectionId, data.sha256Hash, false);
    if (existingByHash) {
      logger.info(`Idempotent evidence upload: returning existing record with matching SHA-256 for inspection ${data.inspectionId}`);
      return existingByHash;
    }

    return await withTransaction(async (session) => {
      const evidenceData: Partial<IEvidence> = {
        inspection: new Types.ObjectId(data.inspectionId),
        evidenceType: data.evidenceType,
        captureSide: data.captureSide,
        storageProvider: data.storageProvider || 'LOCAL_OBJECT_STORE',
        storageBucket: data.storageBucket || 'inspectmate-evidence',
        storageKey,
        sha256Hash: data.sha256Hash,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        dimensions: data.dimensions,
        videoDuration: data.videoDuration,
        capturedAt: new Date(data.capturedAt),
        uploadedAt: new Date(),
        qualityAssessment: 'PENDING'
      };

      const evidence = await evidenceRepository.create(evidenceData, session);

      if (data.qualityAssessment) {
        await qualityAssessmentRepository.create({
          evidenceId: evidence._id as Types.ObjectId,
          inspectionId: new Types.ObjectId(data.inspectionId),
          assessmentId: data.qualityAssessment.assessmentId,
          status: data.qualityAssessment.status,
          score: data.qualityAssessment.score,
          algorithmVersion: data.qualityAssessment.algorithmVersion,
          policyVersion: data.qualityAssessment.policyVersion,
          checks: data.qualityAssessment.checks,
          issues: data.qualityAssessment.issues,
          diagnosticRegions: data.qualityAssessment.diagnosticRegions,
          recommendations: data.qualityAssessment.recommendations,
          processedAt: new Date(data.qualityAssessment.processedAt),
          processingDurationMs: data.qualityAssessment.processingDurationMs
        }, session);

        // Update evidence with quick reference status
        evidence.qualityAssessment = data.qualityAssessment.status;
        await evidence.save({ session });
      }

      // Increment evidence count on inspection
      await inspectionRepository.incrementEvidenceCount(data.inspectionId, session);

      // Create Audit Log
      await auditLogRepository.create({
        actorId: new Types.ObjectId(data.inspectorId),
        actorType: 'USER',
        action: 'EVIDENCE_UPLOADED',
        entityType: 'Evidence',
        entityId: evidence._id as Types.ObjectId,
        inspection: new Types.ObjectId(data.inspectionId),
        changes: [
          {
            field: 'evidenceId',
            newValue: (evidence._id as Types.ObjectId).toString()
          },
          {
            field: 'clientEvidenceId',
            newValue: data.clientEvidenceId
          },
          {
            field: 'captureSide',
            newValue: data.captureSide
          },
          {
            field: 'sha256Hash',
            newValue: data.sha256Hash
          }
        ],
        source: 'API'
      }, session);

      return evidence;
    });
  }

  async getEvidenceById(evidenceId: string, inspectorId: string): Promise<IEvidence | null> {
    const evidence = await evidenceRepository.findById(evidenceId, false);
    if (!evidence) return null;

    const inspection = await inspectionRepository.findById(evidence.inspection.toString(), true);
    if (!inspection || inspection.inspector.toString() !== inspectorId) {
      throw new Error('Unauthorized');
    }

    return evidence;
  }

  async listEvidenceForInspection(inspectionId: string, inspectorId: string): Promise<IEvidence[]> {
    const inspection = await inspectionRepository.findById(inspectionId, true);
    if (!inspection) {
      throw new Error('Inspection not found');
    }

    if (inspection.inspector.toString() !== inspectorId) {
      throw new Error('Unauthorized');
    }

    return await evidenceRepository.listByInspection(inspectionId, true);
  }
}

export const evidenceService = new EvidenceService();
