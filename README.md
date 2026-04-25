# NIDA3DVR — VR Presentation Training Platform

แพลตฟอร์มฝึกนำเสนองานในสภาพแวดล้อม Virtual Reality พร้อมระบบวิเคราะห์การพูดด้วย AI และการดูวิดีโอ 180° SBS แบบ immersive พัฒนาด้วย Next.js 14, Three.js/WebXR, และ Groq AI

**Production URL:** https://nida3dvr.vercel.app  
**Repository:** https://github.com/nattawanmhuaksa04-glitch/nida3dvr

---

## 1. ภาพรวมระบบ (System Overview)

NIDA3DVR เป็นระบบฝึกนำเสนองานด้วย VR ที่รวม 4 ความสามารถหลัก:

1. **VR Presentation Coach** — นำเสนอ slides (PDF) ใน VR environment พร้อมวัดผลด้วย AI
2. **AI Speech Analysis** — วิเคราะห์คำฟุ่มเฟือย ความลื่นไหล โครงสร้าง และการจัดการเวลา
3. **180° VR Video** — ดูวิดีโอ Side-by-Side 180° แบบ stereoscopic ผ่าน WebXR
4. **Heart Rate Monitoring** — วัด BPM realtime ระหว่างนำเสนอ ผ่าน Web Bluetooth API

### ผู้ใช้งานเป้าหมาย
นักศึกษา/ผู้ที่ต้องการฝึกทักษะการนำเสนองานในสภาพแวดล้อมเสมือนจริง

---

## 2. Tech Stack

| ส่วน | เทคโนโลยี | เวอร์ชัน | บทบาท |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.2.35 | Full-stack web framework |
| Language | TypeScript | 5.x | Type safety |
| UI | React + Tailwind CSS v4 | 18.3.1 / 4.2.2 | UI components + styling |
| 3D / VR | Three.js + WebXR API | 0.183.2 | VR rendering, 180° video, interaction |
| Storage | Cloudflare R2 | — | วิดีโอ, thumbnails, slide images (S3-compatible) |
| Database | Upstash Redis (REST) | 1.37.0 | Metadata, session scores, slide URLs |
| Speech-to-Text | Groq Whisper | `whisper-large-v3-turbo` | ถอดเสียงการนำเสนอ |
| AI Analysis | Groq Llama | `llama-3.3-70b-versatile` | วิเคราะห์และให้คะแนนการนำเสนอ |
| PDF Processing | PDF.js | 3.11.174 | แปลง PDF → JPEG slides (browser-side) |
| Deploy | Vercel | — | Hosting + Serverless functions |
| Icons | Lucide React | 1.7.0 | UI icons |

---

## 3. Features

### 3.1 Home (`/`)
- แสดงวิดีโอสุ่ม 2 รายการจาก library พร้อม hero banner
- Preview วิดีโอ 180° inline หรือ Play in VR (WebXR)
- นับ views อัตโนมัติเมื่อเล่น

### 3.2 Video Library (`/videos`)
- แสดงรายการวิดีโอทั้งหมด: thumbnail, ชื่อ, ระยะเวลา, วันที่, views
- เล่น 180° preview หรือ VR fullscreen
- **[Admin]** อัปโหลด MP4 สูงสุด 3 GB, แก้ไข, ลบ
- Thumbnail สร้างอัตโนมัติจากเฟรมที่ 2 วินาที (ครอป left eye)
- ตรวจสอบ spec ก่อนอัปโหลด: resolution, SBS aspect ratio, frame rate, codec

### 3.3 Presentations (`/presentations`)
- รายการ presentation sessions: จำนวน slides, คะแนน, วันที่
- Slide preview ก่อนเข้า VR (Prev/Next + dots)
- Score badge: เขียว ≥ 80 / เหลือง ≥ 60 / แดง < 60
- **[Admin]** อัปโหลด PDF, ลบ session

### 3.4 VR Speech Coach (`/vr-speech-coach`)
- เลือก Presentation (บังคับ) + VR background video (optional)
- เชื่อมต่อ Heart Rate Monitor (optional)
- กด **Enter VR** เพื่อเริ่ม

### 3.5 VR Presentation Mode
- Slides แสดงเป็น 3D plane ระยะ 5 เมตร
- วิดีโอ 180° SBS เป็น background
- บันทึกเสียง microphone ตลอดการนำเสนอ (**chunked recording ทุก 3 นาที** ป้องกัน file size limit)
- HR overlay แสดง BPM realtime
- กด **End** / grip ค้าง 1 วินาที → วิเคราะห์ AI → **Score Report แสดงใน VR** → กด Done ออก

### 3.6 VR Video Mode
- วิดีโอ 180° SBS loop ใน VR
- กด controller → Exit button → เล็ง → กด → ออก

### 3.7 Score Report (Dark Holographic UI)
- Overall score 0–100 พร้อม animated progress ring
- 4 หมวดคะแนน + filler word tags + Key Strengths + To Improve
- ทุก field ผ่าน sanitizer (ตัด CJK, HTML entities, Latin แทรก Thai)

### 3.8 Heart Rate Monitor
- Web Bluetooth API — รองรับ Garmin Forerunner 165 และ BLE HR devices
- BPM realtime: 🟢 < 100 / 🟡 100–129 / 🔴 ≥ 130
- **วิธีใช้:** pair นาฬิกากับ Garmin Connect → เปิด activity → กด HR Monitor ในแอป → Enter VR

---

## 4. AI Scoring System

### 4.1 Pipeline

```
บันทึกเสียง (MediaRecorder, chunked ทุก 3 นาที)
  ↓
Groq Whisper verbose_json
  → filter segments: no_speech_prob ≥ 0.6 ออก
  → ถ้า transcript < 20 ตัวอักษร → Fallback score
  ↓
Groq Llama 3.3-70b-versatile (temperature 0.3)
  → วิเคราะห์ตาม rubric ที่กำหนด
  ↓
Sanitize output
  → strip CJK / HTML entities / Latin-in-Thai
  → filter filler keys นอก schema ออก
  → Redis ล้มก็ยัง return score ได้
  ↓
Score Report
```

### 4.2 Scoring Rubric

**กรณีมี transcript (AI) — รวม 100 คะแนน**

| หมวด | /25 | เกณฑ์ |
|---|---|---|
| Filler Words | /25 | 0คำ=25, 1-2=20, 3-5=15, 6-10=10, >10=5 |
| Fluency | /25 | พูดต่อเนื่อง=21-25, หยุดนิดหน่อย=15-20, หยุดบ่อย=8-14, ไม่ลื่น=1-7 |
| Structure | /25 | ครบ intro+body+conclusion=21-25, บางส่วน=12-20, ขาด=1-11 |
| Time Mgmt | /25 | 45-90วิ/สไลด์=25, 30-44=20, 91-120=18, 15-29=12, 121-180=10, นอกนั้น=5 |

**กรณีไม่มีเสียง (Fallback) — รวมสูงสุด 50 คะแนน**

| หมวด | เกณฑ์ |
|---|---|
| Time Management | เหมือนด้านบน (วัดจาก duration/slideCount) |
| Slide Coverage | 100%=25, 75-99%=18, 50-74%=12, 25-49%=6, <25%=2 |

### 4.3 Hallucination Guards
- Whisper: `no_speech_prob ≥ 0.6` → ตัด segment ออก
- Transcript < 20 ตัวอักษร → ข้าม Llama ใช้ fallback ทันที
- Llama prompt: มี rubric ชัดเจน + "ห้ามสมมติคำฟุ่มเฟือย"
- Server: filter filler keys นอก 6 คำที่กำหนด (เออ/อืม/แบบว่า/อ่า/คือ/ประมาณว่า)
- Server: sanitizeText ตัด CJK, HTML entities, Latin แทรกกลาง Thai

---

## 5. Architecture

### 5.1 System Diagram

```
Browser (Client)
├── PDF.js          → render PDF → JPEG slides
├── Three.js/WebXR  → VR scene, 180° video, slide plane, HR overlay
├── Web Bluetooth   → Heart Rate Monitor (BLE GATT)
├── MediaRecorder   → audio recording WebM Opus (chunked 3 min)
└── Fetch API       → API calls to Vercel

Vercel (Serverless API Routes)
├── /api/proxy-image           → R2 image proxy (CORS bypass)
├── /api/upload/presign-video  → presigned PUT URL for video
├── /api/upload/presign-slide  → presigned PUT URL per slide
├── /api/videos                → CRUD video metadata
├── /api/presentation/session  → CRUD presentation sessions
├── /api/presentation/save-slides → store slide URLs
├── /api/presentation/slides/[id] → fetch slide URLs
├── /api/presentation/transcribe  → Groq Whisper STT
└── /api/presentation/analyze     → Groq Llama scoring + sanitize

External Services
├── Cloudflare R2   → videos, thumbnails, slide images
├── Upstash Redis   → metadata, scores (REST API, no persistent connection)
└── Groq API        → Whisper (STT) + Llama 3.3 (AI analysis)
```

### 5.2 Upload Pipeline

**Video Upload**
```
เลือก MP4 → validate spec (client) → presign-video → XHR PUT ตรง R2
→ generate thumbnail (canvas 2s) → POST /api/videos (metadata → Redis)
```

**Presentation Upload**
```
เลือก PDF → PDF.js render ทุกหน้า → JPEG (scale 2.5, quality 0.92)
→ POST /api/presentation/session → for each slide: presign → PUT R2
→ POST /api/presentation/save-slides (URLs → Redis)
```

**VR Presentation Flow**
```
Enter VR → start MediaRecorder (chunk every 3 min, background transcribe)
→ นำเสนอ slides + วิดีโอ background + HR overlay + บันทึก slideChanges
→ End / grip 1s → stopAndTranscribe (รวม chunks ทั้งหมด)
→ POST /api/presentation/analyze → Score Report ใน VR → Done → ออก
```

### 5.3 CORS Proxy
`pub-*.r2.dev` ไม่ reliable สำหรับ CORS → ใช้ `/api/proxy-image?url=<r2-url>`
validate host ตรง `R2_PUBLIC_DOMAIN` → fetch server-side → Cache-Control 1 วัน

---

## 6. Data Storage

### Redis Schema

| Key | Type | TTL | ข้อมูล |
|---|---|---|---|
| `videos:list` | List | ∞ | Video IDs (newest first) |
| `video:{id}` | Hash | 1 ปี | title, r2Key, thumbnailKey, duration, size, uploadedAt, views |
| `sessions:list` | List | ∞ | Session IDs |
| `session:{id}` | Hash | 30 วัน | title, slideCount, uploadedAt, score (JSON), endTime, duration |
| `session:{id}:slides` | List | 30 วัน | Slide image URLs ตามลำดับ |

### R2 Structure

```
bucket/
├── videos/{videoId}.mp4
├── thumbnails/{videoId}.jpg
└── ppts/{sessionId}/
    ├── slide-000.jpg
    ├── slide-001.jpg
    └── ...
```

---

## 7. Device & Browser Compatibility

| Feature | Meta Quest 2/3/3S/Pro | Chrome/Edge Desktop | Safari | Wolvic |
|---|---|---|---|---|
| VR Mode (WebXR) | ✅ Meta Browser | ✅ | ❌ | ✅ |
| 180° Video | ✅ | ✅ | ✅ | ✅ |
| VR Speech Coach | ✅ | ✅ (no headset) | ❌ | ✅ |
| Heart Rate Monitor | ✅ Meta Browser | ✅ | ❌ | ❌ |
| File Upload | ✅ | ✅ | ✅ | ✅ |

> Web Bluetooth ต้องใช้ Meta Browser หรือ Chrome/Edge เท่านั้น

---

## 8. VR Controls

### Presentation Mode

| Input | Action |
|---|---|
| Trigger / Select | Next slide |
| Button 4 | Previous slide |
| Button 5 หรือ 0 | Next slide |
| Grip ค้าง ≥ 1 วินาที | End → AI analyze |
| End button (3D) | End → AI analyze |
| Arrow Right / B | Next slide |
| Arrow Left / A | Previous slide |
| ESC | ออกโดยไม่วิเคราะห์ |

### Video Mode

| Input | Action |
|---|---|
| ปุ่มใดๆ | Toggle Exit button |
| เล็ง Exit + กด | ออก VR |
| ESC | ออก VR |

---

## 9. Video Requirements

| รายการ | ค่า |
|---|---|
| Format | MP4 (.mp4) |
| VR Type | Side-by-Side (SBS) 180° |
| Resolution | ขั้นต่ำ 1920×1080 · แนะนำ 3840×1920 (4K) |
| Aspect Ratio | ~2:1 (width ≈ 2× height) |
| Frame Rate | 24–60 fps |
| Codec | H.264 (AVC) |
| Max Size | 3 GB |

---

## 10. Project Structure

```
nida3dvr/
├── app/
│   ├── page.tsx                              # Home
│   ├── layout.tsx                            # Root layout + AuthProvider
│   ├── videos/page.tsx                       # Video Library
│   ├── presentations/page.tsx                # Presentations + Slide Preview
│   ├── vr-speech-coach/page.tsx              # VR Speech Coach + HR Monitor
│   └── api/
│       ├── proxy-image/route.ts              # R2 CORS proxy
│       ├── videos/route.ts                   # GET/POST videos
│       ├── videos/[id]/route.ts              # GET/PATCH/DELETE video
│       ├── upload/presign-video/route.ts     # Presigned URL video
│       ├── upload/presign-slide/route.ts     # Presigned URL slide
│       ├── presentation/session/route.ts     # CRUD sessions
│       ├── presentation/save-slides/route.ts # บันทึก slide URLs
│       ├── presentation/slides/[id]/route.ts # ดึง slide URLs
│       ├── presentation/transcribe/route.ts  # Groq Whisper STT
│       └── presentation/analyze/route.ts     # Groq Llama + sanitize
├── components/
│   ├── layout/MainLayout.tsx                 # Sidebar + Bottom nav
│   ├── auth/LoginModal.tsx                   # Admin login modal
│   ├── vr/VRScene.tsx                        # Three.js + WebXR engine
│   ├── video/VideoCard.tsx
│   ├── video/VideoUploadModal.tsx
│   ├── video/VideoPlayer180.tsx              # 180° interactive player
│   ├── video/VideoPlayerModal.tsx
│   ├── presentation/FileUpload.tsx           # PDF → slides → R2
│   ├── presentation/PresentationCard.tsx
│   └── presentation/ScoreReport.tsx         # AI score display (holographic UI)
├── contexts/AuthContext.tsx                  # Admin auth (localStorage)
├── lib/
│   ├── r2.ts                                 # R2 client (presign, delete, URL)
│   ├── redis.ts                              # Upstash Redis client + TTL
│   ├── groq.ts                               # Whisper STT + no_speech filter
│   └── gemini.ts                             # Llama scoring + fallback + rubric
└── types/index.ts                            # TypeScript interfaces
```

---

## 11. Admin

กดไอคอน **N** มุมล่างซ้าย → login → จุดเขียวปรากฏ → Upload / Edit / Delete buttons ปรากฏ  
Session เก็บใน `localStorage` key: `nida3dvr_auth`

---

## 12. Getting Started (Local Dev)

```bash
# 1. ติดตั้ง
npm install

# 2. สร้าง .env.local
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_DOMAIN=          # https://pub-xxxx.r2.dev
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GROQ_API_KEY=
NEXT_PUBLIC_ADMIN_USER=admin
NEXT_PUBLIC_ADMIN_PASS=nida2025

# 3. รัน dev server
npm run dev
# เปิด http://localhost:3000

# 4. ทดสอบบน Quest (ต้อง HTTPS)
cloudflared tunnel --url http://localhost:3000
```

### R2 CORS Policy
```json
[{ "AllowedOrigins": ["*"], "AllowedMethods": ["GET","PUT"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
```

---

## 13. Known Limitations

| ข้อจำกัด | รายละเอียด |
|---|---|
| Safari | ไม่รองรับ WebXR |
| Wolvic | WebXR ได้ แต่ไม่มี Web Bluetooth |
| Whisper accuracy | ความแม่นยำขึ้นกับคุณภาพเสียงและ noise |
| Session TTL | Presentation sessions หมดอายุ 30 วัน |
| Groq Llama | อาจ inject CJK/Latin ใน output — ระบบ sanitize ให้อัตโนมัติ |
| OneDrive dev | ไม่ควร build บน OneDrive path — ใช้ Vercel deploy แทน |
