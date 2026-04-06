import { NextRequest, NextResponse } from "next/server";
import { analyzePresentation, fallbackScore } from "@/lib/gemini";
import redis from "@/lib/redis";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, transcript, duration, slideCount, slideChanges } = await req.json();

    let score;
    try {
      score = await analyzePresentation({ transcript, duration, slideCount, slideChanges });
    } catch (err) {
      console.warn("Gemini failed, using fallback:", err);
      score = fallbackScore(duration, slideCount);
    }

    // Save score to session
    if (sessionId) {
      await redis.hset(`session:${sessionId}`, {
        score: JSON.stringify(score),
        endTime: new Date().toISOString(),
        duration: String(duration),
      });
    }

    return NextResponse.json({ score });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
