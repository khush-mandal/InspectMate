import { logger } from '../utils/logger';

export interface ProductLookupResult {
  gtin: string;
  productName: string | null;
  brand: string | null;
  company: string | null;
  netQuantity: string | null;
  category: string | null;
}

export class ProductLookupService {
  /**
   * Looks up a product by its barcode using Open Food Facts.
   * @param barcode The GTIN or barcode to lookup.
   */
  static async lookupBarcode(barcode: string): Promise<ProductLookupResult | null> {
    try {
      // Open Food Facts API endpoint for a specific product
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'InspectMate/1.0 (Integration/Testing)'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Product not found
        }
        throw new Error(`Open Food Facts API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      if (data.status !== 1 || !data.product) {
        return null; // Product not found in database
      }

      const product = data.product;

      return {
        gtin: barcode,
        productName: product.product_name || product.product_name_en || null,
        brand: product.brands || null,
        company: product.manufacturing_places || product.brand_owner || null,
        netQuantity: product.quantity || null,
        category: product.categories ? product.categories.split(',')[0].trim() : null,
      };
    } catch (error) {
      logger.error('Failed to lookup barcode from Open Food Facts:', error);
      throw error;
    }
  }
}
