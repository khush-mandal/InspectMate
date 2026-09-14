import express, { Request, Response } from 'express';
import { VisionExtractionService } from '../services/VisionExtractionService';
import { logger } from '../utils/logger';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/vision', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }

    const { buffer, mimetype } = req.file;
    const extractedData = await VisionExtractionService.extractFieldsFromImage(buffer, mimetype);

    return res.json({ success: true, data: extractedData });
  } catch (error: any) {
    logger.error('Error in /vision extraction:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
