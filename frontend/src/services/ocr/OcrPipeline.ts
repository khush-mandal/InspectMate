import { EvidenceItem } from '../../types/capture.types';
import { QualityEngine } from '../quality/QualityEngine';
import { IOcrEngine } from './OcrEngine';
import { ImagePreprocessor, PreprocessingOptions } from './ImagePreprocessor';
import { TesseractAdapter } from './TesseractAdapter';
import { FieldExtractor } from './FieldExtractor';
import { ExtractionResult, FieldTarget } from '../../types/ocr.types';
import { BarcodeDecoder } from '../barcode/BarcodeDecoder';
import { IProductLookupProvider } from '../barcode/ProductLookupProvider';
import { ApiProductLookupProvider } from '../barcode/ApiProductLookupProvider';
import { VisionApiClient } from '../vision/VisionApiClient';

export class OcrPipeline {
  private engine: IOcrEngine;
  private barcodeDecoder: BarcodeDecoder;
  private productLookup: IProductLookupProvider;

  constructor(engine?: IOcrEngine, productLookup?: IProductLookupProvider) {
    this.engine = engine || new TesseractAdapter();
    this.barcodeDecoder = new BarcodeDecoder();
    this.productLookup = productLookup || new ApiProductLookupProvider();
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
      if (quality.status === 'ERROR') {
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

      // 2.5 Barcode Detection & Lookup (Parallel or before OCR)
      const barcodeResult = await this.barcodeDecoder.decodeFromBlob(
        evidenceBlob, 
        evidenceRecord.clientEvidenceId, 
        evidenceRecord.inspectionId
      );
      
      let lookupResult = null;
      if (barcodeResult && barcodeResult.normalizedValue) {
        lookupResult = await this.productLookup.lookup(barcodeResult.normalizedValue, barcodeResult.format);
        if (lookupResult) {
          barcodeResult.lookupStatus = 'SUCCESS';
        } else {
          barcodeResult.lookupStatus = 'NOT_FOUND';
        }
      }

      // 3. OCR Engine & Vision Engine (Parallel)
      await this.engine.initialize();
      const [rawResult, visionResult] = await Promise.all([
        this.engine.recognize(processedBlob),
        VisionApiClient.extractFields(evidenceBlob).catch(e => {
          console.error("Vision API failed:", e);
          return null;
        })
      ]);

      // 4. Field Extraction
      const extractedFields = FieldExtractor.extractFields(rawResult, targets, evidenceRecord.clientEvidenceId);

      // Inject Vision Result into Extracted Fields
      if (visionResult) {
        extractedFields.forEach(field => {
          if (field.fieldName === 'mrp' && visionResult.mrp) field.visionCrossCheck = visionResult.mrp;
          if (field.fieldName === 'netQuantity' && visionResult.netQuantity) field.visionCrossCheck = visionResult.netQuantity;
          if (field.fieldName === 'manufacturer' && visionResult.manufacturer) field.visionCrossCheck = visionResult.manufacturer;
          if ((field.fieldName === 'manufacturingDate' || field.fieldName === 'expiryDate') && visionResult.dateInfo) field.visionCrossCheck = visionResult.dateInfo;
          if (field.fieldName === 'consumerCare' && visionResult.consumerCare) field.visionCrossCheck = visionResult.consumerCare;
        });
      }

      // 4.5 Cross-validation with Barcode Lookup
      if (lookupResult) {
        extractedFields.forEach(field => {
          if (field.fieldName === 'productName' && lookupResult.productName) {
            const ocrName = field.value.toLowerCase().replace(/[^a-z0-9]/g, '');
            const lookupName = lookupResult.productName.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!ocrName.includes(lookupName) && !lookupName.includes(ocrName)) {
              field.hasConflict = true;
              field.needsVerification = true;
              field.barcodeReferenceValue = lookupResult.productName;
            } else if (!field.normalizedValue) {
               field.normalizedValue = lookupResult.productName;
            }
          }
          if (field.fieldName === 'brand' && lookupResult.brand) {
             const ocrBrand = field.value.toLowerCase().replace(/[^a-z0-9]/g, '');
             const lookupBrand = lookupResult.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
             if (!ocrBrand.includes(lookupBrand) && !lookupBrand.includes(ocrBrand)) {
                field.hasConflict = true;
                field.needsVerification = true;
                field.barcodeReferenceValue = lookupResult.brand;
             }
          }
          if (field.fieldName === 'manufacturer' && lookupResult.company) {
             const ocrCompany = field.value.toLowerCase().replace(/[^a-z0-9]/g, '');
             const lookupCompany = lookupResult.company.toLowerCase().replace(/[^a-z0-9]/g, '');
             if (!ocrCompany.includes(lookupCompany) && !lookupCompany.includes(ocrCompany)) {
                field.hasConflict = true;
                field.needsVerification = true;
                field.barcodeReferenceValue = lookupResult.company;
             }
          }
        });
      }

      // 5. Evaluate Overall Results
      const hasFailedFields = extractedFields.some(f => f.needsVerification);
      const overallConfidence = rawResult.confidence;

      return {
        evidenceId: evidenceRecord.clientEvidenceId,
        inspectionId: evidenceRecord.inspectionId,
        fields: extractedFields,
        barcodeResult: barcodeResult || undefined,
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
