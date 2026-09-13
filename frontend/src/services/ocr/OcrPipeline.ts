import { EvidenceItem } from '../../types/capture.types';
import { QualityEngine } from '../quality/QualityEngine';
import { IOcrEngine } from './OcrEngine';
import { ImagePreprocessor, PreprocessingOptions } from './ImagePreprocessor';
import { TesseractAdapter } from './TesseractAdapter';
import { FieldExtractor } from './FieldExtractor';
import { ExtractionResult, FieldTarget } from '../../types/ocr.types';

export class OcrPipeline {
  private engine: IOcrEngine;

  constructor(engine?: IOcrEngine) {
    this.engine = engine || new TesseractAdapter();
  }

  async processEvidence(
    evidenceBlob: Blob, 
    evidenceRecord: EvidenceItem, 
    targets: FieldTarget[],
    preprocessOptions?: PreprocessingOptions
  ): Promise<ExtractionResult> {
    const startTime = performance.now();

    try {
      // 1. Quality Validation (Re-use Quality Engine)
      const quality = await QualityEngine.analyze(evidenceBlob);
      if (quality.status === 'RECAPTURE' || quality.status === 'ERROR') {
        return {
          evidenceId: evidenceRecord.clientEvidenceId,
          inspectionId: evidenceRecord.inspectionId,
          fields: [],
          overallConfidence: 0,
          status: 'RECAPTURE_NEEDED',
          message: 'Image quality is too low for OCR: ' + quality.issues.map(i => i.message).join(', '),
          processingTimeMs: Math.round(performance.now() - startTime),
          modelVersion: 'v1.0'
        };
      }

      // 2. Preprocessing
      const processedBlob = await ImagePreprocessor.preprocess(evidenceBlob, preprocessOptions);

      // 3. OCR Engine
      await this.engine.initialize();
      const rawResult = await this.engine.recognize(processedBlob);

      // 4. Field Extraction
      const extractedFields = FieldExtractor.extractFields(rawResult, targets, evidenceRecord.clientEvidenceId);

      // 5. Evaluate Overall Results
      const hasFailedFields = extractedFields.some(f => f.needsVerification);
      const overallConfidence = rawResult.confidence;

      return {
        evidenceId: evidenceRecord.clientEvidenceId,
        inspectionId: evidenceRecord.inspectionId,
        fields: extractedFields,
        overallConfidence,
        status: hasFailedFields ? 'PARTIAL' : 'SUCCESS',
        processingTimeMs: Math.round(performance.now() - startTime),
        modelVersion: 'v1.0'
      };

    } catch (error) {
      console.error('OCR Pipeline error:', error);
      return {
        evidenceId: evidenceRecord.clientEvidenceId,
        inspectionId: evidenceRecord.inspectionId,
        fields: [],
        overallConfidence: 0,
        status: 'FAILED',
        message: 'Pipeline failed: ' + (error instanceof Error ? error.message : String(error)),
        processingTimeMs: Math.round(performance.now() - startTime),
        modelVersion: 'v1.0'
      };
    }
  }

  async shutdown() {
    await this.engine.terminate();
  }
}
