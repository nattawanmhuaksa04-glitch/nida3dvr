import { NextRequest, NextResponse } from "next/server";
import redis, { VIDEO_TTL } from "@/lib/redis";
import { getPresignedGetUrl, getPresignedPutUrl, getPublicUrl } from "@/lib/r2";
import type { Video } from "@/types";

export async function GET() {
  try {
    const ids = await redis.lrange("videos:list", 0, -1) as string[];
    const videos: Video[] = [];

    for (const id of ids) {
      const raw = await redis.hgetall(`video:${id}`) as Record<string, string> | null;
      if (!raw || !raw.id) continue;
      const streamUrl = getPublicUrl(raw.r2Key) ?? await getPresignedGetUrl(raw.r2Key, 3600);
      const thumbnailUrl = raw.thumbnailKey
        ? (getPublicUrl(raw.thumbnailKey) ?? await getPresignedGetUrl(raw.thumbnailKey, 3600))
        : undefined;
      videos.push({ ...raw, streamUrl, thumbnailUrl } as unknown as Video);
    }

    return NextResponse.json({ videos });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoId = formData.get("videoId") as string;
    const title = formData.get("title") as string;
    const size = formData.get("size") as string;
    const mimeType = (formData.get("mimeType") as string) || "video/mp4";
    const r2Key = (formData.get("r2Key") as string) || `videos/${videoId}.mp4`;
    const duration = (formData.get("duration") as string) || "0";
    const description = (formData.get("description") as string) || "";
    const thumbnailFile = formData.get("thumbnail") as File | null;

    if (!videoId || !title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    let thumbnailKey = "";

    // Upload thumbnail if provided
    if (thumbnailFile) {
      thumbnailKey = `thumbnails/${videoId}.jpg`;
      const thumbUrl = await getPresignedPutUrl(thumbnailKey, "image/jpeg");
      await fetch(thumbUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: thumbnailFile,
      });
    }

    const video: Record<string, string> = {
      id: videoId,
      title,
      r2Key,
      thumbnailKey,
      duration,
      size: size || "0",
      uploadedAt: new Date().toISOString(),
      mimeType,
      ...(description ? { description } : {}),
    };

    await redis.hset(`video:${videoId}`, video);
    await redis.expire(`video:${videoId}`, VIDEO_TTL);
    await redis.lpush("videos:list", videoId);

    return NextResponse.json({ success: true, videoId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
