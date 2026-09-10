import { Router } from 'express';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/authMiddleware';
import { evidenceService } from '../services/EvidenceService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

router.use(authenticateJWT);

const createEvidenceSchema = z.object({
  inspectionId: z.string().min(1),
  clientEvidenceId: z.string().min(1),
  clientRequestId: z.string().optional(),
  evidenceType: z.enum(['PHOTO', 'VIDEO', 'BEST_FRAME', 'CROP']),
  captureSide: z.enum(['FRONT', 'BACK', 'SIDE', 'TOP', 'BOTTOM', 'UNKNOWN']).default('UNKNOWN'),
  sha256Hash: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().nonnegative(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  videoDuration: z.number().nonnegative().optional(),
  capturedAt: z.union([z.string(), z.number()]).transform((val) => new Date(val)),
  storageProvider: z.string().optional(),
  storageKey: z.string().optional()
});

router.post('/', authorizeRoles('inspector'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const validatedData = createEvidenceSchema.parse(req.body);

    const evidence = await evidenceService.createEvidence({
      inspectorId: userId,
      ...validatedData
    });

    res.status(201).json({
      success: true,
      data: {
        id: evidence._id,
        serverEvidenceId: evidence._id,
        inspectionId: evidence.inspection,
        clientEvidenceId: validatedData.clientEvidenceId,
        captureSide: evidence.captureSide,
        sha256Hash: evidence.sha256Hash,
        uploadedAt: evidence.uploadedAt,
        syncStatus: 'SYNCED'
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ success: false, error: 'Validation failed', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Inspection not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error instanceof Error && error.message.startsWith('Cannot upload evidence')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    logger.error('Error uploading evidence:', error);
    res.status(500).json({ success: false, error: 'Failed to upload evidence' });
  }
});

router.get('/:id', authorizeRoles('inspector', 'regulator'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const evidenceId = req.params.id;

    const evidence = await evidenceService.getEvidenceById(evidenceId, userId);
    if (!evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    res.json({
      success: true,
      data: evidence
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    logger.error('Error retrieving evidence:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve evidence' });
  }
});

export default router;
