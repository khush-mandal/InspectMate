import { TargetField, FieldRegion } from '../../types/video.types';

/**
 * FieldRegionDetector
 * 
 * Simulated/Mock implementation of region detection for Phase 9.
 * 
 * In a real-world scenario, this would either:
 * 1. Interface with a lightweight local ONNX layout detection model.
 * 2. Send frames to an online API (like Google Cloud Vision or Vertex AI) if connectivity allows.
 * 
 * For this phase, it generates deterministic mock regions based on the frame dimensions and a 
 * pseudo-random seed derived from the timestamp, to demonstrate the field-specific scoring logic.
 */
export class FieldRegionDetector {
  /**
   * Detects regions for requested fields in a given frame.
   * 
   * @param imageData The image data of the frame (unused in mock)
   * @param width Frame width
   * @param height Frame height
   * @param timestampMs Frame timestamp for deterministic mock values
   * @param requestedFields Fields to detect
   */
  static detectRegions(
    imageData: ImageData,
    width: number,
    height: number,
    timestampMs: number,
    requestedFields: TargetField[]
  ): Partial<Record<TargetField, FieldRegion>> {
    const regions: Partial<Record<TargetField, FieldRegion>> = {};

    // Mock implementation: deterministic based on timestamp
    // We simulate that certain fields are only visible at certain times in the video.
    // e.g. front cover is visible early, side labels visible later.

    const timeSeconds = Math.floor(timestampMs / 1000);

    requestedFields.forEach(field => {
      // Create a deterministic pseudo-random number between 0 and 1
      const seedStr = `${field}_${timeSeconds}`;
      const pseudoRand = this.hashString(seedStr) / 100000;

      // Simulate visibility logic:
      let isVisible = false;

      switch (field) {
        case 'FRONT_COVER':
          isVisible = (timeSeconds % 10) < 4; // Visible for first 4 seconds of a 10s loop
          break;
        case 'NUTRITION_FACTS':
        case 'MANUFACTURER_ADDRESS':
          isVisible = (timeSeconds % 10) >= 3 && (timeSeconds % 10) < 7; // Side/Back
          break;
        case 'MRP':
        case 'DATE':
        case 'NET_QUANTITY':
          isVisible = pseudoRand > 0.3; // 70% chance to be "visible"
          break;
        default:
          isVisible = pseudoRand > 0.5;
      }

      if (isVisible) {
        // Generate a mock bounding box (percentages)
        // Ensure width/height are reasonable (e.g. 10% to 40%)
        const boxWidth = 10 + (pseudoRand * 30);
        const boxHeight = 5 + (pseudoRand * 15);
        
        // Ensure x, y keep the box inside the 0-100% bounds
        const x = (pseudoRand * 100) % (100 - boxWidth);
        const y = (this.hashString(seedStr + "_y") / 100000 * 100) % (100 - boxHeight);
        
        const confidence = 50 + (pseudoRand * 50); // 50 to 100

        regions[field] = {
          x,
          y,
          width: boxWidth,
          height: boxHeight,
          confidence
        };
      }
    });

    return regions;
  }

  // Simple string hash for deterministic mock behavior
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit int
    }
    return Math.abs(hash);
  }
}
