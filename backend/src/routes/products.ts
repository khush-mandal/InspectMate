import express, { Request, Response } from 'express';
import { ProductLookupService } from '../services/ProductLookupService';
import { logger } from '../utils/logger';

const router = express.Router();

router.get('/lookup/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    
    if (!barcode) {
      return res.status(400).json({ success: false, error: 'Barcode is required.' });
    }

    const product = await ProductLookupService.lookupBarcode(barcode);

    if (!product) {
      return res.status(404).json({ success: true, data: null, message: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error(`Error in /products/lookup for barcode ${req.params.barcode}:`, error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
