
import { GoogleGenAI } from "@google/genai";

// پاراستنی ئەپڵیکەیشنەکە لە وستان (Crash) ئەگەر پرۆسیس پێناسە نەکرابوو
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    console.warn("API Key نادۆزرایەوە لە گۆڕاوە ژینگەییەکاندا.");
    return "";
  }
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const performANPR = async (base64Image: string): Promise<string> => {
  if (!ai) {
    console.error("سیستمی ژیری دەستکرد کارا نییە بەهۆی نەبوونی کلیلی API");
    return "ABC-1234 (DEMO)";
  }

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
