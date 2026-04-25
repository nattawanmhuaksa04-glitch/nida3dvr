import { NextRequest, NextResponse } from "next/server";
import { analyzePresentation, fallbackScore } from "@/lib/gemini";
import redis from "@/lib/redis";

const ALLOWED_FILLER_KEYS = ["เออ", "อืม", "แบบว่า", "อ่า", "คือ", "ประมาณว่า"];

// Sanitize Llama output: strip CJK, HTML entities, and stray Latin/symbol injections mid-Thai-word
function sanitizeText(text: string): string {
  return text
    .replace(/&[a-z]+;|&#\d+;/gi, "")              // HTML entities (&amp; &#xxx;)
    .replace(/[一-鿿぀-ヿ가-힯]+/g, "")              // CJK characters
    .replace(/(?<=[ก-๛])[a-zA-Z]+(?=[ก-๛])/g, "") // Latin chars sandwiched between Thai chars
    .replace(/\s+/g, " ")
    .trim();
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

    // Sanitize all text fields — guard against missing fields from malformed LLM response
    if (score.breakdown) {
      for (const key of ["fillerWords", "fluency", "structure", "timeManagement"] as const) {
        if (score.breakdown[key]?.feedback) {
          score.breakdown[key].feedback = sanitizeText(score.breakdown[key].feedback);
        }
      }
    }
    score.overallFeedback = sanitizeText(score.overallFeedback ?? "");
    score.strengths    = (score.strengths ?? []).map(sanitizeText);
    score.improvements = (score.improvements ?? []).map(sanitizeText);

    // Strip filler word keys that are outside the allowed Thai list
    const rawDetail: Record<string, number> = score.fillerWordDetail ?? {};
    const filtered: Record<string, number> = {};
    for (const key of ALLOWED_FILLER_KEYS) {
      if (key in rawDetail && typeof rawDetail[key] === "number") filtered[key] = rawDetail[key];
    }
    score.fillerWordDetail = filtered;
    score.fillerWordCount = Object.values(filtered).reduce((a, b) => a + b, 0);

    // Save score to session — don't fail the whole request if Redis is down
    if (sessionId) {
      try {
        await redis.hset(`session:${sessionId}`, {
          score: JSON.stringify(score),
          endTime: new Date().toISOString(),
          duration: String(duration),
        });
      } catch (redisErr) {
        console.warn("Redis save failed (score still returned):", redisErr);
      }
    }

    return NextResponse.json({ score });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
