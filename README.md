# nida3dvr

แพลตฟอร์ม VR สำหรับดูวิดีโอ 360° และฝึกนำเสนองาน พร้อมระบบวิเคราะห์การพูดด้วย AI

---

## Features

### Video Library
- จัดเก็บและแสดงวิดีโอ 360°/180° จาก Cloudflare R2
- เล่นวิดีโอในโหมด VR ผ่าน WebXR บน Meta Quest หรือ browser
- ตรวจสอบ spec วิดีโอก่อนอัปโหลด (resolution, SBS, codec, frame rate)
- Thumbnail ครอปกึ่งกลาง left eye อัตโนมัติ (ไม่ fisheye)

### Presentation Trainer
- อัปโหลดไฟล์ PDF แปลงเป็น slides สำหรับนำเสนอใน VR
- บันทึกเสียงขณะนำเสนอ แล้ว transcribe ด้วย Groq Whisper (ภาษาไทย)
- AI วิเคราะห์การนำเสนอ ให้คะแนน 4 หมวด:
  - **คำฟุ่มเฟือย** — เออ อืม แบบว่า อ่า คือ ประมาณว่า
  - **Fluency** — ความลื่นไหลในการพูด
  - **Structure** — โครงสร้างการนำเสนอ
  - **Time Management** — การจัดการเวลาต่อสไลด์

---

## Video Requirements

| รายการ | ค่าที่รองรับ |
|---|---|
| Format | MP4 (.mp4) |
| VR Type | Side-by-Side (SBS) 180° |
| Resolution | ขั้นต่ำ 1920×1080 · แนะนำ 3840×1920 (4K) |
| Frame Rate | 24 – 60 fps |
| Codec | H.264 (AVC) |
| Audio | Stereo หรือ Spatial Audio |
| Max Size | 2 GB |

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 14 (App Router) |
| 3D / VR | Three.js + WebXR API |
| Storage | Cloudflare R2 (S3-compatible) |
| Database | Upstash Redis |
| Transcription | Groq Whisper (`whisper-large-v3-turbo`) |
| AI Analysis | Groq (`llama-3.3-70b-versatile`) |
| UI | Tailwind CSS v4 |
| Deploy | Vercel |

---

## Project Structure

```
nida3dvr/
├── app/
│   ├── videos/              # หน้า Video Library
│   ├── presentations/       # หน้า Presentation Trainer
│   ├── vr-speech-coach/     # หน้าเลือก Presentation + VR Video แล้วเข้า VR
│   └── api/
│       ├── videos/          # CRUD videos metadata
│       ├── upload/
│       │   └── presign-video/   # Presigned URL สำหรับอัปวิดีโอ
│       ├── presentation/
│       │   ├── session/         # GET/POST/DELETE sessions
│       │   ├── save-slides/     # บันทึก slides
│       │   ├── slides/[id]/     # ดึง slide URLs ของ session
│       │   ├── transcribe/      # Speech-to-text ด้วย Groq Whisper
│       │   └── analyze/         # AI วิเคราะห์และให้คะแนน
├── components/
│   ├── layout/              # MainLayout, Header, Sidebar
│   ├── auth/                # LoginModal
│   ├── vr/                  # VRScene (Three.js + WebXR)
│   ├── video/               # VideoCard, VideoGrid, VideoUploadModal
│   └── presentation/        # FileUpload, SlidePreview, SessionCode,
│                            #   CodeEntry, ScoreReport, PresentationCard
├── contexts/
│   └── AuthContext.tsx      # Admin auth state (localStorage)
├── lib/
│   ├── r2.ts                # Cloudflare R2 client
│   ├── redis.ts             # Upstash Redis client
│   ├── groq.ts              # Groq Whisper transcription
│   └── gemini.ts            # AI analysis (Groq LLM)
└── types/
    └── index.ts             # TypeScript interfaces
```

---

## Admin Login

กดไอคอน **N** มุมล่างซ้าย sidebar เพื่อ login — เมื่อ login แล้วจะเห็นปุ่ม Upload

ตั้งค่า credentials ใน `.env.local`:
---

## VR Interaction

### Video Mode
- กด **Open VR Mode** → เข้า WebXR session อัตโนมัติ
- วิดีโอ loop ตลอดเวลา
- กดปุ่ม controller ปุ่มใดก็ได้ → **Exit VR** button แสดง (bottom center)
- เล็ง controller ไปที่ Exit VR แล้วกด → ออกจาก VR

### Presentation Mode (VR Speech Coach)
- เลือก Presentation + VR Video → กด **Enter VR**
- เลื่อน slide ด้วย controller (trigger/select)
- สไลด์สุดท้าย: กด **End** button (3D, อยู่เหนือสไลด์) → ออกจาก VR → วิเคราะห์ AI
- เชื่อมต่อ **Heart Rate Monitor** ผ่าน Web Bluetooth (Garmin Forerunner 165 หรืออื่นๆ) ก่อนกด Enter VR
  - แสดง BPM แบบ realtime ใน VR HUD ข้างๆ End button
  - สีตามโซน: เขียว < 100 / เหลือง 100–129 / แดง ≥ 130 bpm
  - รองรับบน Meta Browser (Quest Pro/2/3) และ Chrome/Edge บน Mac

---

## Getting Started

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```env
# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_DOMAIN=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Groq API (Whisper + LLM)
GROQ_API_KEY=

# Admin credentials
NEXT_PUBLIC_ADMIN_USER=admin
NEXT_PUBLIC_ADMIN_PASS=nida2025
```

### 3. รัน development server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ใน browser

### 4. เข้าถึงจากอุปกรณ์อื่น

| วิธี | URL |
|---|---|
| Local network | http://192.168.1.43:3000 |
| Cloudflare Tunnel | `cloudflared tunnel --url http://localhost:3000` |

---

## Data TTL (Redis)

| ข้อมูล | อายุ |
|---|---|
| Video metadata | 1 ปี |
| Presentation session | 30 วัน |

---

## VR Projection (180° SBS)

วิดีโอ SBS (Side-by-Side) 180° ใช้ Three.js `SphereGeometry` แบบ hemisphere:
- `phiStart = Math.PI/2`, `phiLength = Math.PI` + `scale(-1,1,1)` + `rotation.y = Math.PI` (2D viewer)
- `rotation.y = -Math.PI/2` สำหรับ VR headset (looking at -Z)
- `texture.repeat.set(0.5, 1)` + `offset.x` สลับ left/right eye ผ่าน `onBeforeRender`
