import express, { Request, Response } from 'express';
import { RulesEngine, EvaluationInput } from '../services/RulesEngine';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { mrp, netQuantity, manufacturer, dateInfo, consumerCare } = req.body;
    
    const evaluationData: EvaluationInput = {
      mrp,
      netQuantity,
      manufacturer,
      dateInfo,
      consumerCare
    };

    const results = await RulesEngine.evaluate(evaluationData);
    
    const passedAll = results.every(r => r.passed);
    const finalStatus = passedAll ? 'VERIFIED' : 'POTENTIAL_VIOLATION';

    return res.json({ 
      success: true, 
      data: {
        finalStatus,
        ruleResults: results
      }
    });
  } catch (error: any) {
    logger.error('Error in /verify rules endpoint:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
