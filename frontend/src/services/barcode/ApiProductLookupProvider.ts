import { IProductLookupProvider, ProductLookupResult } from './ProductLookupProvider';

export class ApiProductLookupProvider implements IProductLookupProvider {
  async lookup(barcode: string, format: string): Promise<ProductLookupResult | null> {
    try {
      let authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/products/lookup/${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        return {
          productName: data.productName || undefined,
          brand: data.brand || undefined,
          company: data.company || undefined,
          category: data.category || undefined,
          source: 'Open Food Facts'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('ApiProductLookupProvider failed to fetch product data:', error);
      return null; // Fail gracefully as per interface
    }
  }
}
