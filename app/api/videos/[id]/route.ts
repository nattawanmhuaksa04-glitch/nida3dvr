import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { deleteObject, getPresignedGetUrl } from "@/lib/r2";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await redis.hgetall(`video:${params.id}`) as Record<string, string> | null;
    if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const streamUrl = await getPresignedGetUrl(raw.r2Key, 7200);
    const thumbnailUrl = raw.thumbnailKey ? await getPresignedGetUrl(raw.thumbnailKey, 7200) : null;
    return NextResponse.json({ ...raw, streamUrl, thumbnailUrl });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const updates: Record<string, string> = {};
      if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
      if (typeof body.description === "string") updates.description = body.description.trim();
      if (Object.keys(updates).length) await redis.hset(`video:${params.id}`, updates);
      return NextResponse.json({ success: true });
    }
    // default: increment views
    const views = await redis.hincrby(`video:${params.id}`, "views", 1);
    return NextResponse.json({ views });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await redis.hgetall(`video:${params.id}`) as Record<string, string> | null;
    if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (raw.r2Key) await deleteObject(raw.r2Key).catch(() => {});
    if (raw.thumbnailKey) await deleteObject(raw.thumbnailKey).catch(() => {});

    await redis.del(`video:${params.id}`);
    await redis.lrem("videos:list", 0, params.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
