import type { AIScore } from "@/types";

interface AnalyzeInput {
  transcript: string;
  duration: number;
  slideCount: number;
  slideChanges: { slideNumber: number; timestamp: number }[];
}

export async function analyzePresentation(input: AnalyzeInput): Promise<AIScore> {
  const { transcript, duration, slideCount, slideChanges } = input;

  // Not enough speech to analyze — skip LLM to avoid hallucination
  if (!transcript || transcript.trim().length < 20) {
    throw new Error("Transcript too short — using fallback");
  }

  const avgTimePerSlide = slideCount > 0 ? Math.round(duration / slideCount) : 0;
  const prompt = `คุณเป็น Public Speaking Coach ผู้เชี่ยวชาญ วิเคราะห์การนำเสนอนี้อย่างละเอียด

## ข้อมูลการนำเสนอ
- เวลาทั้งหมด: ${duration} วินาที (${Math.floor(duration / 60)} นาที ${duration % 60} วินาที)
- จำนวนสไลด์: ${slideCount}
- เวลาเฉลี่ยต่อสไลด์: ${avgTimePerSlide} วินาที
- จำนวนการเปลี่ยนสไลด์: ${slideChanges.length}

## Transcript (RAW - เก็บคำฟุ่มเฟือยทั้งหมด)
${transcript || "(ไม่มี transcript — วิเคราะห์จากข้อมูลเวลาเท่านั้น)"}

## งานของคุณ
วิเคราะห์และให้คะแนนใน 4 หมวด (รวม 100 คะแนน):
1. คำฟุ่มเฟือย (เออ/อืม/แบบว่า/อ่า/คือ/ประมาณว่า) — /25 **นับเฉพาะคำที่ปรากฏใน Transcript จริงเท่านั้น ห้ามสมมติ**
2. ความลื่นไหล (Fluency) — /25
3. โครงสร้างการนำเสนอ — /25
4. การจัดการเวลา — /25

ตอบเป็น JSON เท่านั้น (ไม่มีข้อความอื่น):
{
  "totalScore": <number 0-100>,
  "fluencyScore": <number 1-10>,
  "fillerWordCount": <number>,
  "fillerWordDetail": { "เออ": <count>, "อืม": <count>, "แบบว่า": <count>, "อ่า": <count>, "คือ": <count>, "ประมาณว่า": <count> },
  "breakdown": {
    "fillerWords": { "score": <0-25>, "feedback": "<Thai text>" },
    "fluency": { "score": <0-25>, "feedback": "<Thai text>" },
    "structure": { "score": <0-25>, "feedback": "<Thai text>" },
    "timeManagement": { "score": <0-25>, "feedback": "<Thai text>" }
  },
  "strengths": ["<Thai>", "<Thai>", "<Thai>"],
  "improvements": ["<Thai>", "<Thai>", "<Thai>"],
  "overallFeedback": "<2-3 sentences Thai>"
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq analyze error: ${res.status}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Groq response");

  return JSON.parse(jsonMatch[0]) as AIScore;
}

export function fallbackScore(duration: number, slideCount: number): AIScore {
  const avgTime = slideCount > 0 ? duration / slideCount : 0;
  const timeScore = avgTime >= 30 && avgTime <= 120 ? 20 : avgTime >= 15 ? 15 : 10;
  return {
    totalScore: 50 + timeScore,
    fluencyScore: 6,
    fillerWordCount: 0,
    fillerWordDetail: {},
    breakdown: {
      fillerWords: { score: 20, feedback: "ไม่สามารถวิเคราะห์คำฟุ่มเฟือยได้ (ไม่มี transcript)" },
      fluency: { score: 15, feedback: "ไม่สามารถวิเคราะห์ความลื่นไหลได้" },
      structure: { score: 15, feedback: "ไม่สามารถวิเคราะห์โครงสร้างได้" },
      timeManagement: { score: timeScore, feedback: `เวลาเฉลี่ยต่อสไลด์: ${Math.round(avgTime)} วินาที` },
    },
    strengths: ["สามารถเข้าร่วมการนำเสนอได้"],
    improvements: ["พูดให้ยาวขึ้นเพื่อให้ AI วิเคราะห์ได้ครบถ้วน", "อนุญาต microphone permission ก่อนเริ่ม"],
    overallFeedback: "ไม่สามารถวิเคราะห์ได้ เนื่องจากเสียงที่บันทึกได้สั้นเกินไปหรือไม่มีเสียง กรุณาพูดต่อเนื่องและตรวจสอบ microphone permission",
  };
}
