import { Router } from 'express';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/authMiddleware';
import { inspectionService } from '../services/InspectionService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Protect all inspection routes
router.use(authenticateJWT);

const locationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90)
  ])
});

const createInspectionSchema = z.object({
  clientReference: z.string().uuid().optional(),
  productCategory: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  location: locationSchema.optional()
});

const updateMetadataSchema = z.object({
  productCategory: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  location: locationSchema.optional()
});

router.post('/', authorizeRoles('inspector'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const validatedData = createInspectionSchema.parse(req.body);

    const inspection = await inspectionService.createInspection({
      inspectorId: userId,
      ...validatedData
    });

    res.status(201).json({
      success: true,
      data: {
        id: inspection._id,
        inspectionId: inspection._id, // Expose for easy mapping
        lifecycleStatus: inspection.lifecycleStatus,
        createdAt: inspection.createdAt,
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ success: false, error: 'Validation failed', details: error.issues });
    }
    logger.error('Error creating inspection:', error);
    res.status(500).json({ success: false, error: 'Failed to create inspection' });
  }
});

router.put('/:id/metadata', authorizeRoles('inspector'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const inspectionId = req.params.id;
    const validatedData = updateMetadataSchema.parse(req.body);

    const inspection = await inspectionService.updateMetadata(inspectionId, userId, validatedData);
    
    res.json({
      success: true,
      data: {
        id: inspection?._id,
        lifecycleStatus: inspection?.lifecycleStatus,
        updatedAt: inspection?.updatedAt
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
    if (error instanceof Error && error.message.startsWith('Cannot update metadata')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    logger.error('Error updating inspection metadata:', error);
    res.status(500).json({ success: false, error: 'Failed to update inspection metadata' });
  }
});

router.get('/dashboard', authorizeRoles('inspector'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const dashboardData = await inspectionService.getDashboard(userId);
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error: any) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

export default router;
