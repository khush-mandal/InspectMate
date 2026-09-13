import { createWorker, Worker } from 'tesseract.js';
import { IOcrEngine } from './OcrEngine';
import { OcrRawResult, OcrLine, OcrWord } from '../../types/ocr.types';

export class TesseractAdapter implements IOcrEngine {
  private worker: Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Offline note: In a true offline PWA environment, we would configure workerPath,
      // corePath, and langPath to point to local assets instead of pulling from unpkg.
      // For this phase, we let tesseract.js use its defaults but assume the service 
      // worker is caching the requests.
      this.worker = await createWorker('eng');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Tesseract worker:', error);
      throw new Error('OCR Engine initialization failed.');
    }
  }

  async recognize(imageBlob: Blob | ImageData): Promise<OcrRawResult> {
    if (!this.worker || !this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
        throw new Error('Worker not initialized');
    }

    // Tesseract's recognize takes an image URL, File, Blob, Image, or Canvas
    let imageSource: string | ImageData | Blob = imageBlob;
    let urlToRevoke: string | null = null;

    if (imageBlob instanceof Blob) {
        urlToRevoke = URL.createObjectURL(imageBlob);
        imageSource = urlToRevoke;
    }

    try {
      const result = await this.worker.recognize(imageSource);
      
      const lines: OcrLine[] = result.data.lines.map(line => ({
        text: line.text,
        confidence: line.confidence,
        bbox: {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0,
        },
        words: line.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0,
          }
        }))
      }));

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        lines
      };
    } finally {
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}
