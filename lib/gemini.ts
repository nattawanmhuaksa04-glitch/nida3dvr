import type { AIScore } from "@/types";

interface AnalyzeInput {
  transcript: string;
  duration: number;
  slideCount: number;
  slideChanges: { slideNumber: number; timestamp: number }[];
}

export function calcTimeScore(avgTime: number): { score: number; feedback: string } {
  if (avgTime >= 45 && avgTime <= 90)  return { score: 25, feedback: `เวลาเฉลี่ยต่อสไลด์ ${Math.round(avgTime)} วินาที — เหมาะสมที่สุด` };
  if (avgTime >= 30 && avgTime < 45)   return { score: 20, feedback: `เวลาเฉลี่ยต่อสไลด์ ${Math.round(avgTime)} วินาที — ดี แต่เร็วเล็กน้อย` };
  if (avgTime > 90 && avgTime <= 120)  return { score: 18, feedback: `เวลาเฉลี่ยต่อสไลด์ ${Math.round(avgTime)} วินาที — ดี แต่ช้าเล็กน้อย` };
  if (avgTime >= 15 && avgTime < 30)   return { score: 12, feedback: `เวลาเฉลี่ยต่อสไลด์ ${Math.round(avgTime)} วินาที — เร็วเกินไป` };
  if (avgTime > 120 && avgTime <= 180) return { score: 10, feedback: `เวลาเฉลี่ยต่อสไลด์ ${Math.round(avgTime)} วินาที — ช้าเกินไป` };
  return { score: 5, feedback: `เวลาเฉลี่ยต่อสไลด์ ${Math.round(avgTime)} วินาที — ผิดปกติ (สั้นหรือยาวเกินไป)` };
}

export function calcCoverageScore(slideChanges: { slideNumber: number }[], slideCount: number): { score: number; feedback: string } {
  if (slideCount === 0) return { score: 0, feedback: "ไม่มีสไลด์" };
  const unique = new Set(slideChanges.map(c => c.slideNumber)).size;
  const pct = unique / slideCount;
  if (pct >= 1.0)   return { score: 25, feedback: `นำเสนอครบ ${unique}/${slideCount} สไลด์` };
  if (pct >= 0.75)  return { score: 18, feedback: `นำเสนอ ${unique}/${slideCount} สไลด์ (${Math.round(pct*100)}%)` };
  if (pct >= 0.5)   return { score: 12, feedback: `นำเสนอ ${unique}/${slideCount} สไลด์ (${Math.round(pct*100)}%)` };
  if (pct >= 0.25)  return { score: 6,  feedback: `นำเสนอ ${unique}/${slideCount} สไลด์ (${Math.round(pct*100)}%) — น้อยเกินไป` };
  return { score: 2, feedback: `นำเสนอ ${unique}/${slideCount} สไลด์ (${Math.round(pct*100)}%) — แทบไม่ได้นำเสนอ` };
}

const FILLER_PATTERNS: Record<string, RegExp> = {
  "เออ":        /เออ/g,
  "อืม":        /อืม/g,
  "แบบว่า":     /แบบว่า/g,
  "อ่า":        /อ่า/g,
  "คือ":        /(?<![ก-๛])คือ(?![ก-๛])/g,
  "ประมาณว่า":  /ประมาณว่า/g,
};

export function countFillerWords(transcript: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [word, pattern] of Object.entries(FILLER_PATTERNS)) {
    const matches = transcript.match(pattern);
    result[word] = matches ? matches.length : 0;
  }
  return result;
}

export async function analyzePresentation(input: AnalyzeInput): Promise<AIScore> {
  const { transcript, duration, slideCount, slideChanges } = input;

  // Not enough speech to analyze — skip LLM to avoid hallucination
  if (!transcript || transcript.trim().length < 20) {
    throw new Error("Transcript too short — using fallback");
  }

  const avgTimePerSlide = slideCount > 0 ? Math.round(duration / slideCount) : 0;

  // Count filler words from transcript directly — don't let Llama count them
  const preCountedFillers = countFillerWords(transcript);
  const totalFillers = Object.values(preCountedFillers).reduce((a, b) => a + b, 0);
  const fillerSummary = totalFillers > 0
    ? Object.entries(preCountedFillers).filter(([, v]) => v > 0).map(([k, v]) => `${k} (${v})`).join(", ")
    : "ไม่พบคำฟุ่มเฟือย";

  const prompt = `คุณเป็น Public Speaking Coach ผู้เชี่ยวชาญ วิเคราะห์การนำเสนอนี้อย่างละเอียด

## ข้อมูลการนำเสนอ
- เวลาทั้งหมด: ${duration} วินาที (${Math.floor(duration / 60)} นาที ${duration % 60} วินาที)
- จำนวนสไลด์: ${slideCount}
- เวลาเฉลี่ยต่อสไลด์: ${avgTimePerSlide} วินาที
- จำนวนการเปลี่ยนสไลด์: ${slideChanges.length}

## ผลการนับคำฟุ่มเฟือย (นับแล้วโดย system — ใช้ตัวเลขนี้เท่านั้น อย่านับใหม่)
- รวม: ${totalFillers} คำ
- รายละเอียด: ${fillerSummary}

## Transcript (RAW)
${transcript}

## เกณฑ์การให้คะแนน (ต้องทำตาม rubric นี้เท่านั้น)

### 1. คำฟุ่มเฟือย /25
- 0 คำ = 25, 1-2 คำ = 20, 3-5 คำ = 15, 6-10 คำ = 10, >10 คำ = 5
- **ใช้จำนวน ${totalFillers} คำ จากข้อมูลด้านบน — ห้ามนับใหม่จาก Transcript**

### 2. ความลื่นไหล (Fluency) /25
- พูดต่อเนื่อง ไม่หยุดกลางประโยค = 21-25
- หยุดบ้างเล็กน้อย = 15-20
- หยุดบ่อย/พูดซ้ำๆ = 8-14
- ไม่ลื่นไหลชัดเจน = 1-7

### 3. โครงสร้าง /25
- มีเปิด+เนื้อหา+ปิดครบ = 21-25
- มีบางส่วน = 12-20
- ขาดโครงสร้างชัดเจน = 1-11

### 4. การจัดการเวลา /25
- เวลาเฉลี่ยต่อสไลด์ 45-90 วินาที = 25
- 30-44 วินาที = 20, 91-120 วินาที = 18
- 15-29 วินาที = 12, 121-180 วินาที = 10
- <15 หรือ >180 วินาที = 5

ตอบเป็น JSON เท่านั้น (ไม่มีข้อความอื่น):
{
  "totalScore": <number 0-100>,
  "fluencyScore": <number 1-10>,
  "fillerWordCount": ${totalFillers},
  "fillerWordDetail": ${JSON.stringify(preCountedFillers)},
  "breakdown": {
    "fillerWords": { "score": <0-25>, "feedback": "<Thai text สรุปผลคำฟุ่มเฟือย>" },
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

export function fallbackScore(
  duration: number,
  slideCount: number,
  slideChanges: { slideNumber: number; timestamp: number }[] = []
): AIScore {
  const avgTime = slideCount > 0 ? duration / slideCount : 0;
  const time = calcTimeScore(avgTime);
  const coverage = calcCoverageScore(slideChanges, slideCount);
  const total = time.score + coverage.score;

  return {
    totalScore: total,
    fluencyScore: 0,
    fillerWordCount: 0,
    fillerWordDetail: {},
    breakdown: {
      fillerWords:    { score: 0, feedback: "ไม่สามารถวิเคราะห์ได้ (เสียงสั้นเกินไป)" },
      fluency:        { score: 0, feedback: "ไม่สามารถวิเคราะห์ได้ (เสียงสั้นเกินไป)" },
      structure:      { score: coverage.score, feedback: coverage.feedback },
      timeManagement: { score: time.score,     feedback: time.feedback },
    },
    strengths: ["สามารถเข้าร่วมการนำเสนอได้"],
    improvements: ["พูดให้ยาวขึ้นเพื่อให้ AI วิเคราะห์ได้ครบถ้วน", "อนุญาต microphone permission ก่อนเริ่ม"],
    overallFeedback: "ไม่สามารถวิเคราะห์เสียงได้ วัดได้เฉพาะเวลาต่อสไลด์และจำนวนสไลด์ที่นำเสนอ กรุณาพูดต่อเนื่องและตรวจสอบ microphone permission",
  };
}
