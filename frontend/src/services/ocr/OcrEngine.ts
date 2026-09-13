import { OcrRawResult } from '../../types/ocr.types';

export interface IOcrEngine {
  /**
   * Initializes the OCR engine (e.g. loads workers, downloads models if needed).
   */
  initialize(): Promise<void>;

  /**
   * Performs OCR on the given image data and returns raw text lines with confidence.
   */
  recognize(imageBlob: Blob | ImageData): Promise<OcrRawResult>;

  /**
   * Terminates any background workers to free up memory.
   */
  terminate(): Promise<void>;
}
