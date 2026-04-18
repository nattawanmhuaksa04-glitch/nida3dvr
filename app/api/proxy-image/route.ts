import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = process.env.R2_PUBLIC_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (ALLOWED_HOST && parsed.host !== ALLOWED_HOST) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const res = await fetch(url);
  if (!res.ok) return new NextResponse("Upstream error", { status: res.status });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
