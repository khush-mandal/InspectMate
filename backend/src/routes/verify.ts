import express, { Request, Response } from 'express';
import { RulesEngine, EvaluationInput } from '../services/RulesEngine';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const evaluationData: EvaluationInput = req.body;
    const summary = await RulesEngine.evaluate(evaluationData);

    return res.json({ 
      success: true, 
      data: summary
    });
  } catch (error: any) {
    logger.error('Error in /verify rules endpoint:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
