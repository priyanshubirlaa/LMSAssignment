import { NextRequest, NextResponse } from "next/server";
import { GeminiRequestError, generateText } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const raw = await generateText(
      `Read the following note and return 3-5 short topic tags for it as a single comma-separated line (lowercase, one or two words each, no hashtags, no numbering, no extra text).\n\nNote:\n${content}`
    );
    const tags = raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
    return NextResponse.json({ tags });
  } catch (err) {
    if (err instanceof GeminiRequestError) {
      return NextResponse.json(
        { error: err.message, retryAfterSeconds: err.retryAfterSeconds },
        { status: err.status }
      );
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
