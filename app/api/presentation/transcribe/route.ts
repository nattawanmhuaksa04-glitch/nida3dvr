import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/groq";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) return NextResponse.json({ transcript: "" });

    const blob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type || "audio/webm" });
    const transcript = await transcribeAudio(blob, audioFile.name || "recording.webm");
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("Transcribe error:", err);
    return NextResponse.json({ transcript: "", error: String(err) });
  }
}
