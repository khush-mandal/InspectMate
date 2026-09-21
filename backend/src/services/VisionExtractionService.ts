import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ExtractedFields {
  productName: string | null;
  category: string | null;
  isEdible: boolean;
  barcode: string | null;
  mrp: string | null;
  hasDualPricing: boolean;
  netQuantity: string | null;
  manufacturer: string | null;
  dateInfo: string | null;
  consumerCare: string | null;
  ingredients: string | null;
  nutritionalInfo: string | null;
  readabilityScore: number;
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    productName: {
      type: Type.STRING,
      description: "Brand and commercial product name found on the package."
    },
    category: {
      type: Type.STRING,
      description: "Product category, e.g., 'FOOD_BEVERAGE', 'COSMETICS', 'HOUSEHOLD', 'PHARMA', or 'GENERAL_COMMODITY'."
    },
    isEdible: {
      type: Type.BOOLEAN,
      description: "True if this is a food, drink, snack, or edible commodity; false otherwise."
    },
    barcode: {
      type: Type.STRING,
      description: "Barcode or GTIN numeric digits visible on the packaging, or null."
    },
    mrp: {
      type: Type.STRING,
      description: "The Maximum Retail Price (MRP) found on the packaging. Include currency symbol (e.g. ₹) and tax statement if present."
    },
    hasDualPricing: {
      type: Type.BOOLEAN,
      description: "True if there is evidence of an altered price sticker pasted over an original printed price, or conflicting prices."
    },
    netQuantity: {
      type: Type.STRING,
      description: "The net quantity or weight (e.g., '500 g', '1 L', '750 ml')."
    },
    manufacturer: {
      type: Type.STRING,
      description: "The name and full registered address of the manufacturer, packer, or importer."
    },
    dateInfo: {
      type: Type.STRING,
      description: "Manufacturing date (MFD), Expiry date, or Best Before date information."
    },
    consumerCare: {
      type: Type.STRING,
      description: "Consumer care details including phone number, email address, or redressal officer contact."
    },
    ingredients: {
      type: Type.STRING,
      description: "List of ingredients declared on the package, especially for edible products."
    },
    nutritionalInfo: {
      type: Type.STRING,
      description: "Nutritional information declaration (Energy, Protein, Carbohydrates, Fat, etc.) for edible commodities."
    },
    readabilityScore: {
      type: Type.NUMBER,
      description: "Confidence/legibility score from 0 to 100 on how clearly the statutory text is printed and visible."
    }
  },
  required: [
    "productName",
    "category",
    "isEdible",
    "barcode",
    "mrp",
    "hasDualPricing",
    "netQuantity",
    "manufacturer",
    "dateInfo",
    "consumerCare",
    "ingredients",
    "nutritionalInfo",
    "readabilityScore"
  ]
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

      const prompt = `You are an expert Legal Metrology and statutory packaging compliance auditor.
Analyze this captured commercial package image and extract all statutory declarations into the requested schema:
1. Product name and brand.
2. Commodity category (e.g. FOOD_BEVERAGE, COSMETICS, HOUSEHOLD, or GENERAL_COMMODITY). Set isEdible=true if edible/food/drink.
3. Barcode digits if visible on the package.
4. Maximum Retail Price (MRP). Check if it includes "incl. of all taxes".
5. Detect if there is dual pricing or an altered price sticker placed over the printed label (set hasDualPricing=true).
6. Net Quantity (with standard statutory unit like g, kg, ml, L, or N).
7. Complete manufacturer/packer/importer name and registered address.
8. Dates: Manufacturing date (MFD), Expiry, or Best Before.
9. Consumer Care grievance details: helpline phone, email, or contact address.
10. If this is an edible product, extract the Ingredients list and Nutritional Information table. If not present or not an edible product, return null.
11. Rate overall text readability score from 0 to 100 based on blur, lighting, and clarity.
If any specific field is absent or completely illegible, return null for that field.`;

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
