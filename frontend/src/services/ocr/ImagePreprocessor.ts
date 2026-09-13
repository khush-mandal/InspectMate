export interface PreprocessingOptions {
  grayscale?: boolean;
  contrast?: number; // 0 to 200, 100 is normal
  sharpen?: boolean;
}

export class ImagePreprocessor {
  /**
   * Applies preprocessing techniques to an image Blob.
   * Returns a new Blob representing the preprocessed image.
   */
  static async preprocess(imageBlob: Blob, options: PreprocessingOptions = {}): Promise<Blob> {
    const {
      grayscale = true,
      contrast = 120, // slightly enhance contrast by default
      sharpen = true
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageBlob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (grayscale) {
          imageData = this.applyGrayscale(imageData);
        }

        if (contrast !== 100) {
          imageData = this.applyContrast(imageData, contrast);
        }

        if (sharpen) {
          imageData = this.applyUnsharpMask(imageData);
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, imageBlob.type || 'image/jpeg', 0.95);
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for preprocessing: ' + e));
      };

      img.src = url;
    });
  }

  private static applyGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Luminosity method
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = avg;     // red
      data[i + 1] = avg; // green
      data[i + 2] = avg; // blue
    }
    return imageData;
  }

  private static applyContrast(imageData: ImageData, contrast: number): ImageData {
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = this.clamp(factor * (data[i] - 128) + 128);
      data[i + 1] = this.clamp(factor * (data[i + 1] - 128) + 128);
      data[i + 2] = this.clamp(factor * (data[i + 2] - 128) + 128);
    }
    return imageData;
  }

  private static applyUnsharpMask(imageData: ImageData): ImageData {
    // A simple 3x3 sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    return this.convolute(imageData, kernel);
  }

  private static convolute(imageData: ImageData, kernel: number[]): ImageData {
    const side = Math.round(Math.sqrt(kernel.length));
    const halfSide = Math.floor(side / 2);
    const src = imageData.data;
    const sw = imageData.width;
    const sh = imageData.height;
    
    // We create a new ImageData instead of modifying in place to avoid bleeding
    const output = new ImageData(sw, sh);
    const dst = output.data;

    const w = sw;
    const h = sh;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dstOff = (y * w + x) * 4;
        let r = 0, g = 0, b = 0;

        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;
            
            if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
              const srcOff = (scy * w + scx) * 4;
              const wt = kernel[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
            }
          }
        }
        dst[dstOff] = this.clamp(r);
        dst[dstOff + 1] = this.clamp(g);
        dst[dstOff + 2] = this.clamp(b);
        dst[dstOff + 3] = src[dstOff + 3]; // keep original alpha
      }
    }
    return output;
  }

  private static clamp(value: number): number {
    return Math.max(0, Math.min(255, value));
  }
}
