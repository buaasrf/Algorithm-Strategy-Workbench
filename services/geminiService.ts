
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function runLLMNode(prompt: string, context: any) {
  try {
    const systemPrompt = `You are a strategic algorithm assistant. Context from previous nodes: ${JSON.stringify(context)}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });
    // Ensure response.text is returned as a string or empty string fallback
    return response.text ?? "";
  } catch (error) {
    console.error("Gemini Execution Error:", error);
    throw error;
  }
}

export async function suggestOptimizations(scenarioJson: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Examine this algorithm strategy and suggest 3 optimizations for efficiency or accuracy: ${scenarioJson}`,
      config: {
        temperature: 0.3,
      },
    });
    // Ensure response.text is returned as a string or fallback message
    return response.text ?? "No optimizations suggested.";
  } catch (error) {
    return "Could not generate suggestions at this time.";
  }
}
