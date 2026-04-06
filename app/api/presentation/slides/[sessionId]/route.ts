import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const slides = await redis.lrange(`session:${params.sessionId}:slides`, 0, -1) as string[];
    return NextResponse.json({ slides, success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
