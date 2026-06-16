import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SurveyDoc } from "./firestore";

const KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

function getModel() {
  const genAI = new GoogleGenerativeAI(KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export async function generateRecommendations(survey: SurveyDoc) {
  if (!KEY) return FALLBACK_RECS;
  try {
    const model = getModel();
    const prompt = `
User's annual carbon footprint:
- Energy: ${survey.energyKg} kg CO2 (${survey.heatingType} heating, ${survey.houseSizeM2}m² home, ${survey.occupants} occupants)
- Transport: ${survey.transportKg} kg CO2 (${survey.transportMode}, ${survey.flightsPerYear} flights/year)
- Food: ${survey.foodKg} kg CO2 (${survey.diet} diet)
- Shopping: ${survey.shoppingKg} kg CO2
- Total: ${survey.baselineKg} kg CO2/year

Give exactly 3 specific, actionable recommendations to reduce their footprint.
Return ONLY a JSON array (no markdown, no explanation):
[{"category":"energy","message":"...","savingsKg":150},...]
Valid categories: energy, transport, food, shopping, general`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fall through to fallback
  }
  return FALLBACK_RECS;
}

const FALLBACK_RECS = [
  { category: "transport", message: "Switch one weekly car trip to public transport or cycling to save fuel costs and emissions.", savingsKg: 200 },
  { category: "food", message: "Try 2 meat-free days per week. Replacing beef with legumes cuts food emissions significantly.", savingsKg: 300 },
  { category: "energy", message: "Lower your thermostat by 1°C and use LED bulbs throughout your home.", savingsKg: 150 },
];

export async function* streamGeminiChat(message: string, history: Array<{ role: string; content: string }>) {
  if (!KEY) {
    yield "Gemini API key not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.";
    return;
  }
  try {
    const model = getModel();
    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      systemInstruction: `You are a friendly carbon footprint coach named Sage.
      Give concise, encouraging advice. Use specific numbers when helpful.
      Focus on practical actions people can take today.`,
    });
    const result = await chat.sendMessageStream(message);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (err: any) {
    yield `Error: ${err?.message ?? "Could not connect to Gemini"}`;
  }
}
