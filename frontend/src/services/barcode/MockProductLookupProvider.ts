import { IProductLookupProvider, ProductLookupResult } from './ProductLookupProvider';

const MOCK_DB: Record<string, ProductLookupResult> = {
  '8901030985552': {
    productName: 'Lays Classic Salted',
    brand: 'Lays',
    company: 'PepsiCo',
    category: 'Snacks',
    source: 'Mock DB'
  },
  '8901491100516': {
    productName: 'Maggi 2-Minute Noodles',
    brand: 'Maggi',
    company: 'Nestle',
    category: 'Food',
    source: 'Mock DB'
  },
  '0049000028904': {
    productName: 'Coca-Cola Classic',
    brand: 'Coca-Cola',
    company: 'The Coca-Cola Company',
    category: 'Beverage',
    source: 'Mock DB'
  }
};

export class MockProductLookupProvider implements IProductLookupProvider {
  async lookup(barcode: string, format: string): Promise<ProductLookupResult | null> {
    console.log(`[MockProductLookupProvider] Looking up barcode ${barcode} (${format})...`);
    
    // Simulate non-blocking offline lookup with minor delay
    return new Promise(resolve => {
      setTimeout(() => {
        const result = MOCK_DB[barcode] || null;
        if (result) {
          console.log(`[MockProductLookupProvider] Found: ${result.productName}`);
        } else {
          console.log(`[MockProductLookupProvider] Not found.`);
        }
        resolve(result);
      }, 50);
    });
  }
}
