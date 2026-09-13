import { ExtractedField } from './domain.types';

export type FieldTarget = 
  | 'productName'
  | 'manufacturer'
  | 'packer'
  | 'importer'
  | 'netQuantity'
  | 'mrp'
  | 'batchNumber'
  | 'manufacturingDate'
  | 'expiryDate'
  | 'bestBefore'
  | 'consumerCare'
  | 'countryOfOrigin';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: OcrWord[];
}

export interface OcrRawResult {
  text: string;
  confidence: number;
  lines: OcrLine[];
}

export interface OcrJobConfig {
  targets: FieldTarget[];
  language?: string;
  enhanceImage?: boolean;
}

export interface ExtractionResult {
  evidenceId: string;
  inspectionId: string;
  fields: ExtractedField[];
  overallConfidence: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'RECAPTURE_NEEDED';
  message?: string;
  processingTimeMs: number;
  modelVersion: string;
}
