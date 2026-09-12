import { FrameCandidate, TargetField } from '../../types/video.types';
import { QualityEngine } from '../quality/QualityEngine';
import { FieldRegionDetector } from './FieldRegionDetector';

export interface ExtractionOptions {
  sampleFps: number;
  requestedFields: TargetField[];
  onProgress?: (processedFrames: number, totalFrames: number) => void;
}

export class FrameExtractor {
  /**
   * Extracts frames from a video file, runs two-stage filtering, and generates FrameCandidates.
   */
  static async extractFrames(
    videoFile: File,
    videoId: string,
    options: ExtractionOptions
  ): Promise<FrameCandidate[]> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(videoFile);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = async () => {
        try {
          const duration = video.duration;
          if (!duration || !isFinite(duration)) {
            throw new Error("Invalid video duration");
          }

          const totalFramesToSample = Math.floor(duration * options.sampleFps);
          const interval = 1 / options.sampleFps;

          const candidates: FrameCandidate[] = [];
          
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (!ctx) throw new Error("Could not create canvas context");

          // Process incrementally
          for (let i = 0; i <= totalFramesToSample; i++) {
            const time = i * interval;
            video.currentTime = time;
            
            // Wait for seeked
            await new Promise<void>(res => {
              video.onseeked = () => res();
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Stage 1: Cheap filtering (Skip very dark or completely uniform frames)
            // Mock: Assumed pass for simplicity, real implementation would do pixel diffing here.

            // Stage 2: Deep Quality Analysis
            // We need to convert canvas to blob for QualityEngine.analyze which currently takes a File/Blob.
            const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8));
            if (!blob) continue;

            const tempFile = new File([blob], `frame_${i}.jpg`, { type: 'image/jpeg' });
            
            // Evaluate Quality
            const qualityAssessment = await QualityEngine.analyze(tempFile);
            
            // Evaluate Regions
            const detectedRegions = FieldRegionDetector.detectRegions(
              imageData, 
              canvas.width, 
              canvas.height, 
              Math.floor(time * 1000), 
              options.requestedFields
            );

            // Create object URL for preview
            const localUri = URL.createObjectURL(blob);

            candidates.push({
              frameId: `frame_${crypto.randomUUID()}`,
              videoEvidenceId: videoId,
              frameNumber: i,
              timestampMs: Math.floor(time * 1000),
              localMediaId: '', // To be saved later if selected
              localUri,
              width: canvas.width,
              height: canvas.height,
              quality: {
                sharpness: qualityAssessment.checks.blur?.score || 0,
                glare: qualityAssessment.checks.glare?.score || 0,
                exposure: 50, // mock
                textVisibility: qualityAssessment.checks.textVisibility?.score || 0,
                overallQuality: qualityAssessment.score
              },
              detectedRegions,
              selectionStatus: 'NOT_SELECTED'
            });

            if (options.onProgress) {
              options.onProgress(i + 1, totalFramesToSample + 1);
            }
          }

          URL.revokeObjectURL(url);
          resolve(candidates);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video for frame extraction."));
      };
    });
  }
}
