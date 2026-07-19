import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiRequestError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiRequestError("GEMINI_API_KEY is not configured on the server.", 500);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      const retryMatch = message.match(/retry in ([\d.]+)s/i);
      const retryAfterSeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : undefined;
      throw new GeminiRequestError(
        "Gemini API quota exceeded for this key. Check your plan/billing at https://ai.google.dev/gemini-api/docs/rate-limits, or try again later.",
        429,
        retryAfterSeconds
      );
    }

    throw new GeminiRequestError(message, 500);
  }
}
