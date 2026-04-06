export async function transcribeAudio(audioBlob: Blob, filename = "recording.webm"): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "th");
  formData.append("response_format", "text");
  formData.append(
    "prompt",
    "ถอดความตามที่พูดจริงทั้งหมด รวมถึงคำฟุ่มเฟือย เช่น เออ อืม แบบว่า อ่า คือ ประมาณว่า นะครับ นะคะ"
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

  const text = await res.text();
  return text.trim();
}
