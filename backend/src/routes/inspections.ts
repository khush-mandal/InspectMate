import { Router } from 'express';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/authMiddleware';
import { inspectionService } from '../services/InspectionService';
import { logger } from '../utils/logger';

const router = Router();

// Protect all inspection routes
router.use(authenticateJWT);

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
