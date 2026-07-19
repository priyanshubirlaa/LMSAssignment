import { NextRequest, NextResponse } from "next/server";
import { GeminiRequestError, generateText } from "@/lib/gemini";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const summary = await generateText(
      `Summarize the following note in 1-2 short sentences. Be concise and only return the summary text, no preamble.\n\nNote:\n${content}`
    );
    return NextResponse.json({ summary });
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
