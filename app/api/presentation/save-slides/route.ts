import { NextRequest, NextResponse } from "next/server";
import redis, { SESSION_TTL } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, slides } = await req.json();
    if (!sessionId || !Array.isArray(slides)) {
      return NextResponse.json({ error: "Missing sessionId or slides" }, { status: 400 });
    }

    const key = `session:${sessionId}:slides`;
    await redis.del(key);
    if (slides.length > 0) {
      await redis.rpush(key, ...slides);
    }
    await redis.expire(key, SESSION_TTL);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
