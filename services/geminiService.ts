
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // لە Vite/Vercel دا، گۆڕاوە ژینگەییەکان بەم شێوەیە دەخوێندرێنەوە
  const key = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY || "";
  return key;
};

export const performANPR = async (base64Image: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("API Key dawkari krawa balam nya.");
    return "ABC-1234 (DEMO)";
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: "تەنها ژمارەی تابلۆی ئۆتۆمبێلەکە بخوێنەوە. تەنها دەقەکە بنووسە بەبێ هیچ وشەیەکی زیادە." }
        ]
      },
      config: {
        responseMimeType: "text/plain",
      }
    });

    return response.text?.trim() || "UNKNOWN";
  } catch (error) {
    console.error("ANPR Error:", error);
    return "ERR-001";
  }
};
