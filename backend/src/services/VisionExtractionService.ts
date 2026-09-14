import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ExtractedFields {
  mrp: string | null;
  netQuantity: string | null;
  manufacturer: string | null;
  dateInfo: string | null;
  consumerCare: string | null;
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mrp: {
      type: Type.STRING,
      description: "The Maximum Retail Price (MRP) found on the packaging. Include currency symbol if present."
    },
    netQuantity: {
      type: Type.STRING,
      description: "The net quantity or weight (e.g. 500g, 1L, 100ml)."
    },
    manufacturer: {
      type: Type.STRING,
      description: "The name and address of the manufacturer or marketer."
    },
    dateInfo: {
      type: Type.STRING,
      description: "Manufacturing date (MFD), Expiry date, or Best Before date information."
    },
    consumerCare: {
      type: Type.STRING,
      description: "Consumer care details such as email, phone number, or address."
    }
  },
  required: ["mrp", "netQuantity", "manufacturer", "dateInfo", "consumerCare"]
};

export class VisionExtractionService {
  /**
   * Extracts fields from an image using Gemini.
   * @param imageBuffer Buffer containing the image data
   * @param mimeType Mime type of the image (e.g., 'image/jpeg')
   */
  static async extractFieldsFromImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractedFields> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }

      const prompt = `You are a compliance AI designed to read packaging labels. 
Extract the MRP, net quantity, manufacturer details, dates, and consumer care information from this image.
If a field is not found or unreadable, return null for that field.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: mimeType,
            }
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        }
      });

      if (!response.text) {
        throw new Error("Empty response from Gemini.");
      }

      const extracted: ExtractedFields = JSON.parse(response.text);
      return extracted;
    } catch (error: any) {
      logger.error('Failed to extract fields with Gemini:', error);
      throw error;
    }
  }
}
