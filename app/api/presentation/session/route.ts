import { NextRequest, NextResponse } from "next/server";
import redis, { SESSION_TTL } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const ids = await redis.lrange("sessions:list", 0, 49) as string[];
    const sessions = [];
    for (const id of ids) {
      const raw = await redis.hgetall(`session:${id}`) as Record<string, string> | null;
      if (!raw || !raw.id) continue;
      const slideKeys = await redis.lrange(`session:${id}:slides`, 0, 0) as string[];
      let score;
      try { score = raw.score ? JSON.parse(raw.score) : undefined; } catch { score = undefined; }
      sessions.push({
        ...raw,
        slides: slideKeys,
        score,
        slideCount: raw.slideCount ? Number(raw.slideCount) : undefined,
      });
    }
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, slideCount } = await req.json();
    const sessionId = uuidv4();
    const session: Record<string, string> = {
      id: sessionId,
      title: title || "Untitled",
      slideCount: String(slideCount || 0),
      uploadedAt: new Date().toISOString(),
    };
    await redis.hset(`session:${sessionId}`, session);
    await redis.expire(`session:${sessionId}`, SESSION_TTL);
    await redis.lpush("sessions:list", sessionId);
    return NextResponse.json({ sessionId });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await redis.del(`session:${id}`);
    await redis.del(`session:${id}:slides`);
    await redis.lrem("sessions:list", 0, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
