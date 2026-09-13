import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BarcodeResult } from '../../types/domain.types';

export class BarcodeDecoder {
  private reader: BrowserMultiFormatReader;

  constructor() {
    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX
    ]);
    
    this.reader = new BrowserMultiFormatReader(hints);
  }

  /**
   * Attempts to detect and decode a barcode from an image blob.
   */
  async decodeFromBlob(blob: Blob, evidenceId: string, inspectionId: string): Promise<BarcodeResult | null> {
    let imageUrl: string | null = null;
    
    try {
      imageUrl = URL.createObjectURL(blob);
      const imageElement = new Image();
      
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
        imageElement.src = imageUrl!;
      });

      const result = await this.reader.decode(imageElement);
      
      if (result) {
        const rawValue = result.getText();
        let normalizedValue = rawValue;
        const formatString = BarcodeFormat[result.getBarcodeFormat()];
        
        // Normalize UPC-A to EAN-13 for consistent lookup
        if (formatString === 'UPC_A' && rawValue.length === 12) {
          normalizedValue = '0' + rawValue;
        }

        return {
          id: crypto.randomUUID(),
          evidenceId,
          inspectionId,
          format: formatString,
          rawValue,
          normalizedValue,
          confidence: 1.0, // zxing returns decoded or throws, effectively high confidence
          detectedAt: new Date(result.getTimestamp()),
          createdAt: new Date(),
          updatedAt: new Date(),
          lookupStatus: 'PENDING'
        };
      }
    } catch (error) {
      // NotFoundException is expected if no barcode is in the image
      // console.debug('BarcodeDecoder: No barcode found or decode failed');
    } finally {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
    
    return null;
  }
}
