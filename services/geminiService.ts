
import { GoogleGenAI } from "@google/genai";

export const performANPR = async (base64Image: string): Promise<string> => {
  // بەکارهێنانی ڕاستەوخۆی process.env.API_KEY بەپێی ڕێنماییەکان
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API Key missing, using demo plate.");
    return "ABC-1234 (DEMO)";
  }

  // دروستکردنی ئینستانسی نوێی AI پێش هەر داواکارییەک
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { 
            inlineData: { 
              data: base64Image.split(',')[1], 
              mimeType: 'image/jpeg' 
            } 
          },
          { text: "Extract only the vehicle license plate number from this image. Output the text directly with no extra words." }
        ]
      },
      config: {
        systemInstruction: "You are an expert ANPR (Automated Number Plate Recognition) system. Your goal is to accurately read and return only the characters on a vehicle's license plate.",
      }
    });

    // بەکارهێنانی .text وەک property نەک وەک method
    const plateText = response.text;
    return plateText?.trim() || "UNKNOWN";
  } catch (error: any) {
    console.error("ANPR Error:", error);
    // گەڕاندنەوەی ئیرۆر ئەگەر کێشەی دەسەڵات (Permission) هەبێت
    if (error?.message?.includes("Requested entity was not found")) {
      return "AUTH_REQUIRED";
    }
    return "ERR_ANPR";
  }
};
