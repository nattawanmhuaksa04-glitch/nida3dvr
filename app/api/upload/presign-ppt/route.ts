import { NextRequest, NextResponse } from "next/server";
import { getPresignedPutUrl } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { filename, mimeType } = await req.json();
    const id = uuidv4();
    const ext = filename.split(".").pop() || "pdf";
    const key = `ppts/${id}.${ext}`;
    const uploadUrl = await getPresignedPutUrl(key, mimeType || "application/pdf", 3600);
    return NextResponse.json({ uploadUrl, id, key });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
