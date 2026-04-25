export async function transcribeAudio(audioBlob: Blob, filename = "recording.webm"): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "th");
  formData.append("response_format", "verbose_json");
  formData.append(
    "prompt",
    "ถอดความภาษาไทยตามที่พูดจริงทุกคำ ห้ามเพิ่มหรือสรุปเอง"
  );

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Whisper error: ${err}`);
  }

  const data = await res.json().catch(() => null);
  if (!data) throw new Error("Groq Whisper returned non-JSON");

  const segments: { text: string; no_speech_prob?: number }[] = Array.isArray(data.segments) ? data.segments : [];

  // Filter out segments where Whisper is confident there's no speech (no_speech_prob >= 0.6)
  const speechSegments = segments.filter(s => (s.no_speech_prob ?? 0) < 0.6);

  if (speechSegments.length === 0) return "";

  return speechSegments.map(s => s.text).join(" ").trim();
}
