import { NextRequest, NextResponse } from "next/server";
import { analyzePresentation, fallbackScore } from "@/lib/gemini";
import redis from "@/lib/redis";

const ALLOWED_FILLER_KEYS = ["เออ", "อืม", "แบบว่า", "อ่า", "คือ", "ประมาณว่า"];

// Strip CJK characters (Chinese/Japanese/Korean) that Llama occasionally injects
function stripCJK(text: string): string {
  return text.replace(/[一-鿿぀-ヿ가-힯]+/g, "").replace(/\s+/g, " ").trim();
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, transcript, duration, slideCount, slideChanges } = await req.json();

    let score;
    try {
      score = await analyzePresentation({ transcript, duration, slideCount, slideChanges });
    } catch (err) {
      console.warn("Gemini failed, using fallback:", err);
      score = fallbackScore(duration, slideCount, slideChanges);
    }

    // Sanitize all text fields — strip CJK characters Llama occasionally injects
    for (const key of ["fillerWords", "fluency", "structure", "timeManagement"] as const) {
      if (score.breakdown[key]?.feedback) {
        score.breakdown[key].feedback = stripCJK(score.breakdown[key].feedback);
      }
    }
    if (score.overallFeedback) score.overallFeedback = stripCJK(score.overallFeedback);
    score.strengths    = score.strengths?.map(stripCJK) ?? [];
    score.improvements = score.improvements?.map(stripCJK) ?? [];

    // Strip filler word keys that are outside the allowed Thai list
    if (score.fillerWordDetail) {
      const filtered: Record<string, number> = {};
      for (const key of ALLOWED_FILLER_KEYS) {
        if (key in score.fillerWordDetail) filtered[key] = score.fillerWordDetail[key];
      }
      score.fillerWordDetail = filtered;
      score.fillerWordCount = Object.values(filtered).reduce((a, b) => a + b, 0);
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
