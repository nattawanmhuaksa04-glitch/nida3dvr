import { NextRequest, NextResponse } from "next/server";
import { getPresignedPutUrl } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { filename, size, mimeType } = await req.json();
    if (!filename || !mimeType) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (size > 2 * 1024 ** 3) return NextResponse.json({ error: "File exceeds 2 GB limit" }, { status: 400 });

    const videoId = uuidv4();
    const ext = filename.split(".").pop() || "mp4";
    const key = `videos/${videoId}.${ext}`;

    const uploadUrl = await getPresignedPutUrl(key, mimeType, 7200);
    return NextResponse.json({ uploadUrl, videoId, key });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
