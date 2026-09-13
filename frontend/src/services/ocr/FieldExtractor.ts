import { OcrRawResult, FieldTarget } from '../../types/ocr.types';
import { ExtractedField } from '../../types/domain.types';

export class FieldExtractor {
  
  static extractFields(rawResult: OcrRawResult, targets: FieldTarget[], sourceEvidenceId: string): ExtractedField[] {
    const extractedFields: ExtractedField[] = [];
    const text = rawResult.text;

    for (const target of targets) {
      let value = '';
      let confidence = 0;

      // Basic regex heuristics
      switch (target) {
        case 'mrp': {
          // Look for MRP, M.R.P., Rs, ₹ followed by numbers
          const match = text.match(/(?:MRP|M\.R\.P\.|Rs\.?|₹)\s*:?\s*(\d+(?:\.\d{1,2})?)/i);
          if (match && match[1]) {
            value = match[1];
            confidence = this.calculateConfidence(match[0], rawResult);
          }
          break;
        }
        case 'netQuantity': {
          // Look for Net Wt, Net Vol, Weight followed by number and unit (g, kg, ml, l)
          const match = text.match(/(?:Net Wt|Net Weight|Weight|Vol|Volume)\s*:?\s*(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|mg))/i);
          if (match && match[1]) {
            value = match[1];
            confidence = this.calculateConfidence(match[0], rawResult);
          }
          break;
        }
        case 'batchNumber': {
          // Look for Batch No, B.No, Lot No
          const match = text.match(/(?:Batch No|B\.No|Lot No|Batch)\s*:?\s*([A-Z0-9-]+)/i);
          if (match && match[1]) {
            value = match[1];
            confidence = this.calculateConfidence(match[0], rawResult);
          }
          break;
        }
        case 'manufacturingDate': {
          // Look for Mfg Date, Mfd
          const match = text.match(/(?:Mfg Date|Mfd|Pkd)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/i);
          if (match && match[1]) {
            value = match[1];
            confidence = this.calculateConfidence(match[0], rawResult);
          }
          break;
        }
        case 'expiryDate': {
          // Look for Exp Date, Expiry
          const match = text.match(/(?:Exp Date|Expiry|Use By)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/i);
          if (match && match[1]) {
            value = match[1];
            confidence = this.calculateConfidence(match[0], rawResult);
          }
          break;
        }
        case 'bestBefore': {
          // Look for Best before X months
          const match = text.match(/Best before\s+(.+?(?=months|days|years))(?:months|days|years)/i);
          if (match && match[1]) {
            value = match[0].trim();
            confidence = this.calculateConfidence(match[0], rawResult);
          }
          break;
        }
        case 'productName':
        case 'manufacturer':
        case 'packer':
        case 'importer':
        case 'consumerCare':
        case 'countryOfOrigin':
          // These are much harder to extract purely with regex on unstructured text.
          // For now, we might return empty or try very basic keyword spotting.
          // In a production system, this is where NLP/NER would be used.
          break;
      }

      // If we found a value, we consider it. If confidence is too low, or if we didn't find anything,
      // we still create the field but mark it as needing verification (or empty).
      extractedFields.push({
        fieldName: target,
        value: value,
        normalizedValue: value, // In a real app, normalize dates/currencies
        confidence: confidence,
        sourceEvidenceId: sourceEvidenceId,
        extractionMethod: 'REGEX_HEURISTIC',
        needsVerification: confidence < 80 || value === ''
      });
    }

    return extractedFields;
  }

  /**
   * Helper to estimate confidence. 
   * It finds the matched string in the OCR words and averages their confidence.
   */
  private static calculateConfidence(matchedString: string, rawResult: OcrRawResult): number {
    if (!matchedString || !rawResult.lines) return 50; // Fallback

    const wordsToFind = matchedString.split(/\s+/);
    let totalConf = 0;
    let matchCount = 0;

    for (const line of rawResult.lines) {
      for (const word of line.words) {
        if (wordsToFind.some(w => word.text.includes(w) || w.includes(word.text))) {
          totalConf += word.confidence;
          matchCount++;
        }
      }
    }

    if (matchCount === 0) return 60; // Fallback if exact words not easily mapped
    return Math.round(totalConf / matchCount);
  }
}
