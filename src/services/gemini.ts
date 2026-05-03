import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AuraReading {
  aura_color: string;
  vibe_score: number;
  archetype: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  daily_advice: string;
  share_caption: string;
  hidden_insight?: string;
}

const PERSONAL_SIGNALS = [
  "You’ve been thinking about something you haven’t said out loud yet.",
  "There’s a decision you’ve been quietly delaying.",
  "You’re in a transition phase, even if it doesn’t look like it externally.",
  "Something in your life is about to shift, and you can feel it.",
  "You’ve outgrown something, but haven’t fully let it go yet.",
  "There’s a version of you trying to emerge right now.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const AURA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    aura_color: { type: Type.STRING, description: "1 word, vivid and unique color" },
    vibe_score: { type: Type.INTEGER, description: "integer between 60–100" },
    archetype: { type: Type.STRING, description: "2–3 words describing matching archetype" },
    description: { type: Type.STRING, description: "2–3 lines, emotional and engaging" },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "exactly 3 bullet points" },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "exactly 2 bullet points" },
    daily_advice: { type: Type.STRING, description: "1 short line" },
    share_caption: { type: Type.STRING, description: "1 catchy viral sentence" },
  },
  required: ["aura_color", "vibe_score", "archetype", "description", "strengths", "weaknesses", "daily_advice", "share_caption"]
};

export async function generateAura(imageB64?: string, lastAura?: { color: string; archetype: string }): Promise<AuraReading> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are an AI that generates fun, engaging, slightly mystical aura readings for users. 
  Your tone is modern, Gen-Z friendly, and highly shareable. 
  CRITICAL: 
  1. Be unique and specific. Avoid cliches like "you have a bright future" or "you are a leader".
  2. Use weighted selection for colors: prefer rare shades.
  3. Archetypes should be creative expressions (e.g. "Solitary Neon Dreamer", "Cosmic Night Owl").
  4. Ensure strengths (exactly 3) and weaknesses (exactly 2) are distinct and not repetitive.
  5. The output must ALWAYS be strict JSON.`;

  let prompt = `Generate a personalized aura reading. 
  Seed: ${Math.random()}. 
  ${lastAura ? `DO NOT use the color "${lastAura.color}" or archetype "${lastAura.archetype}" to ensure variety.` : ""}
  If no image is provided, provide a more abstract, mystical reading based on the "temporal vibes" of this exact moment.`;

  let parts: any[] = [{ text: prompt }];

  if (imageB64) {
    prompt = `Analyze the person in this image based on visible cues like expression, posture, and mood. 
    Use a more "observational" tone since you can "see" them. 
    Increase vibe_score slightly (+3 to +7) for the effort of sharing a photo.
    Generate a detailed aura reading. 
    ${lastAura ? `Avoid: ${lastAura.color}, ${lastAura.archetype}.` : ""}`;
    parts = [
      { text: prompt },
      { inlineData: { data: imageB64, mimeType: "image/jpeg" } }
    ];
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: AURA_SCHEMA,
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate aura reading");
  }

  const data = JSON.parse(response.text) as AuraReading;
  const signal = pick(PERSONAL_SIGNALS);
  
  data.hidden_insight = signal;
  
  // Refined personalization logic to avoid double-prepending and add flow
  let personalizedDesc = "";
  if (imageB64) {
    personalizedDesc = "Based on your visual signature, there’s a marked clarity in your presence right now. ";
  }
  
  data.description = `${personalizedDesc}${signal} ${data.description}`;

  return data;
}

export async function generateLoadingMessages(): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate 5 short loading messages for an aura scanning app. Style: Futuristic, Mystical. 3-6 words each.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}
