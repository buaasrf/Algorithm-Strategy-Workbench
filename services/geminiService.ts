
import { GoogleGenAI } from "@google/genai";

export async function runLLMNode(prompt: string, context: any) {
  try {
    // 在函数调用时动态获取 API Key 并初始化，避免顶层作用域崩溃
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemPrompt = `You are a strategic algorithm assistant. Context from previous nodes: ${JSON.stringify(context)}.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });
    
    return response.text ?? "";
  } catch (error) {
    console.error("Gemini 节点执行失败:", error);
    throw error;
  }
}

export async function suggestOptimizations(scenarioJson: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `分析以下算法策略工作流，并提供3个关于效率或准确性的优化建议: ${scenarioJson}`,
      config: {
        temperature: 0.3,
      },
    });
    
    return response.text ?? "暂时无法生成建议。";
  } catch (error) {
    console.error("Gemini 优化建议生成失败:", error);
    return "AI 建议服务目前不可用。";
  }
}
