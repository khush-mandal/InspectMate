import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeImageQuality(base64Image: string, mimeType: string = "image/jpeg") {
  const prompt = `Analyze this captured image for inspection verification quality. Return strict JSON with numeric scores (0 to 100) and pass/fail boolean values for: sharpness, glare, resolution, and textVisibility.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sharpness: { type: Type.NUMBER },
          glare: { type: Type.NUMBER },
          resolution: { type: Type.NUMBER },
          textVisibility: { type: Type.NUMBER },
          isAcceptable: { type: Type.BOOLEAN },
          feedbackMessage: { type: Type.STRING },
        },
        required: ["sharpness", "glare", "resolution", "textVisibility", "isAcceptable", "feedbackMessage"],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}
