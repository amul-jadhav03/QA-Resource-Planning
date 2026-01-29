import { GoogleGenAI, Type } from "@google/genai";
import { Resource, AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeResources = async (resources: Resource[]): Promise<AnalysisResult> => {
  if (!apiKey) {
    return {
      summary: "API Key missing. Cannot generate analysis.",
      underutilized: [],
      overloaded: [],
      suggestions: ["Configure API Key to enable AI insights."]
    };
  }

  const prompt = `
    Analyze the following resource allocation data for a software team.
    Identify:
    1. A short summary of the team's current workload state.
    2. A list of resource names who are underutilized (less than 20 hours assigned).
    3. A list of resource names who are overloaded (more than 35 hours assigned).
    4. 3 specific, actionable suggestions for the manager to balance the load.

    Data: ${JSON.stringify(resources.map(r => ({
      name: r.name,
      role: r.role,
      // Filter out completed tasks for AI analysis
      totalHours: r.tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.hours, 0),
      capacity: r.maxCapacity
    })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            underutilized: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            overloaded: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Failed to analyze data.",
      underutilized: [],
      overloaded: [],
      suggestions: ["Check network connection.", "Try again later."]
    };
  }
};