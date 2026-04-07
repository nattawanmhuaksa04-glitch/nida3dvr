import { NextRequest, NextResponse } from "next/server";
import { getPresignedPutUrl, getPublicUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, index } = await req.json();
    if (!sessionId || index === undefined) {
      return NextResponse.json({ error: "Missing sessionId or index" }, { status: 400 });
    }
    const key = `ppts/${sessionId}/slide-${String(index).padStart(3, "0")}.jpg`;
    const uploadUrl = await getPresignedPutUrl(key, "image/jpeg");
    const publicUrl = getPublicUrl(key);
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
