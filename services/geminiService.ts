
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API with the required parameter format.
// Always use the apiKey from process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const performANPR = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: "Read only the vehicle license plate number from this image. Output the plate number text exactly, no other words." }
        ]
      },
      config: {
        responseMimeType: "text/plain",
      }
    });

    // Use the .text property to access the generated text content from the response
    return response.text?.trim() || "UNKNOWN";
  } catch (error) {
    console.error("ANPR Error:", error);
    return "ERR-001";
  }
};
