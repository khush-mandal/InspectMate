export interface ProductLookupResult {
  productName?: string;
  brand?: string;
  company?: string;
  category?: string;
  netQuantity?: string;
  source: string;
}

export interface IProductLookupProvider {
  /**
   * Looks up product information based on a barcode.
   * This should be non-blocking and fail gracefully offline.
   *
   * @param barcode The raw or normalized barcode value
   * @param format The format of the barcode (e.g., 'EAN_13', 'UPC_A')
   */
  lookup(barcode: string, format: string): Promise<ProductLookupResult | null>;
}
