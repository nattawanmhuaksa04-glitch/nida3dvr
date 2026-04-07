# NIDA3DVR

แพลตฟอร์ม VR สำหรับดูวิดีโอ 360°/180° และฝึกนำเสนองาน พร้อมระบบวิเคราะห์การพูดด้วย AI

**URL:** https://nida3dvr.vercel.app

---

## Features

### Home
- แสดงวิดีโอ 2 รายการแบบสุ่มจากทั้งหมด
- กดดูวิดีโอแบบ 180° preview ได้ทันที หรือกด Play in VR เพื่อเข้า WebXR

### Video Library (`/videos`)
- รายการวิดีโอทั้งหมด — thumbnail, ชื่อ, ระยะเวลา, วันอัปโหลด, จำนวน views
- เล่นวิดีโอในโหมด 180° preview หรือ VR fullscreen
- **Admin**: อัปโหลด MP4 (สูงสุด 2 GB), แก้ไข title/description, ลบวิดีโอ
- Thumbnail สร้างอัตโนมัติ — ครอปกึ่งกลาง left eye (ไม่ fisheye)
- ตรวจสอบ spec วิดีโอก่อนอัปโหลด (resolution, SBS format, codec, frame rate)

### Presentations (`/presentations`)
- รายการ presentation sessions — slide count, score (ถ้าเคย present แล้ว), วันอัปโหลด
- **Admin**: อัปโหลด PDF → แปลงเป็น slides PNG (ด้วย PDF.js ใน browser), ลบ session
- Score badge แสดงสีตามผล: เขียว ≥ 80 / เหลือง ≥ 60 / แดง < 60

### VR Speech Coach (`/vr-speech-coach`)
- เลือก Presentation (บังคับ) + VR Video background (optional) → กด **Enter VR**
- เชื่อมต่อ **Heart Rate Monitor** (optional) ก่อนเข้า VR ได้เลย

### VR Presentation Mode
- Slides แสดงเป็น 3D ตรงกลาง, วิดีโอ 180° SBS เป็น background
- เลื่อน slide: controller trigger / arrow keys / gamepad
- กด **End** button (3D เหนือสไลด์) หรือ grip button ค้าง 1 วิ → ออก VR → AI วิเคราะห์
- บันทึกเสียง microphone ตลอดการนำเสนอ → transcribe ด้วย Groq Whisper
- **HR overlay** (ถ้า connect นาฬิกา): แสดง BPM ข้างๆ End button แบบ realtime

### VR Video Mode
- วิดีโอ 180° SBS loop ใน VR
- กด controller → Exit VR button ปรากฏ → เล็ง → กด → ออก VR

### Score Report
- Overall score 0–100 + progress ring
- 4 หมวด (25 คะแนนแต่ละหมวด):
  | หมวด | รายละเอียด |
  |---|---|
  | Filler Words | นับคำ เออ/อืม/แบบว่า/อ่า/คือ/ประมาณว่า |
  | Fluency | ความลื่นไหลในการพูด |
  | Structure | โครงสร้างการนำเสนอ |
  | Time Management | เวลาต่อสไลด์ |
- Strengths + Improvements + Overall feedback (AI-generated)

### Heart Rate Monitor
- เชื่อมต่อผ่าน **Web Bluetooth** — รองรับ Garmin Forerunner 165 และ BLE HR devices อื่นๆ
- **วิธีใช้**:
  1. สวมนาฬิกา + pair กับ Garmin Connect app บนมือถือก่อน
  2. เปิด activity บนนาฬิกา (เพื่อให้ broadcast HR)
  3. กด **HR Monitor** ในหน้า VR Speech Coach → เลือก Forerunner
  4. กด **Enter VR** — HR จะแสดงใน VR scene
- สีตามโซน: เขียว < 100 / เหลือง 100–129 / แดง ≥ 130 bpm
- กดปุ่ม **X** ข้างปุ่ม HR เพื่อ disconnect

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

## Browser & Device Compatibility

| ฟีเจอร์ | Meta Browser (Quest) | Chrome/Edge Desktop | Safari | Wolvic |
|---|---|---|---|---|
| VR Mode (WebXR) | ✅ | ✅ | ❌ | ✅ |
| 180° Video Player | ✅ | ✅ | ✅ | ✅ |
| Heart Rate Monitor | ✅ Quest Pro/2/3 | ✅ | ❌ | ❌ |

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
│   ├── page.tsx             # Home — แสดงวิดีโอสุ่ม 2 รายการ
│   ├── videos/              # Video Library
│   ├── presentations/       # Presentation Trainer
│   ├── vr-speech-coach/     # เลือก Presentation + Video → Enter VR
│   └── api/
│       ├── videos/          # CRUD video metadata + view counter
│       ├── upload/
│       │   └── presign-video/   # Presigned URL สำหรับ upload ตรงไป R2
│       └── presentation/
│           ├── session/         # GET/POST/DELETE sessions
│           ├── save-slides/     # บันทึก slide URLs
│           ├── slides/[id]/     # ดึง slide URLs ของ session
│           ├── transcribe/      # Speech-to-text ด้วย Groq Whisper
│           └── analyze/         # AI วิเคราะห์ให้คะแนน 4 หมวด
├── components/
│   ├── layout/              # MainLayout + Sidebar
│   ├── auth/                # LoginModal
│   ├── vr/                  # VRScene (Three.js + WebXR)
│   ├── video/               # VideoCard, VideoUploadModal, VideoPlayer180, VideoPlayerModal
│   └── presentation/        # FileUpload (PDF.js), ScoreReport, PresentationCard
├── contexts/
│   └── AuthContext.tsx      # Admin auth (localStorage)
├── lib/
│   ├── r2.ts                # Cloudflare R2 client
│   ├── redis.ts             # Upstash Redis client
│   ├── groq.ts              # Groq Whisper transcription
│   └── gemini.ts            # AI score analysis (Groq Llama)
└── types/
    └── index.ts             # TypeScript interfaces
```

---

## Admin Login

กดไอคอน **N** มุมล่างซ้าย sidebar → ใส่ username/password → login

เมื่อ login แล้ว: จุดเขียวที่ไอคอน N + ปุ่ม Upload ปรากฏ

Session เก็บใน `localStorage` key `nida3dvr_auth`

ตั้งค่า credentials ใน `.env.local`:
```
NEXT_PUBLIC_ADMIN_USER=admin
NEXT_PUBLIC_ADMIN_PASS=nida2025
```

---

## VR Controls

### Presentation Mode
| Input | Action |
|---|---|
| Controller trigger / Select | Next slide |
| Gamepad Button 4 | Previous slide |
| Gamepad Button 5 / 0 | Next slide |
| Grip hold 1+ วิ | End presentation |
| Arrow Right / B key | Next slide |
| Arrow Left / A key | Previous slide |
| ESC | ออกโดยไม่วิเคราะห์ |
| กด End button (3D) | ออก → AI วิเคราะห์ |

### Video Mode
| Input | Action |
|---|---|
| ปุ่มใดๆ บน controller | Toggle Exit VR button |
| เล็งที่ Exit VR + กด | ออกจาก VR |
| ESC | ออกจาก VR |

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

### 4. เข้าถึงจากอุปกรณ์อื่น (สำหรับทดสอบ Quest)

```bash
cloudflared tunnel --url http://localhost:3000
```

---

## Data Storage (Redis)

| ข้อมูล | TTL |
|---|---|
| Video metadata | 1 ปี |
| Presentation session | 30 วัน |

**R2 Storage Prefixes:**
- `videos/` — ไฟล์วิดีโอ
- `thumbnails/` — thumbnail images
- `ppts/` — slide PNG images

---

## VR Projection (180° SBS)

วิดีโอ SBS (Side-by-Side) 180° ใช้ Three.js `SphereGeometry` แบบ hemisphere:

```js
// Geometry
const geo = new THREE.SphereGeometry(500, 64, 32, Math.PI / 2, Math.PI);
geo.scale(-1, 1, 1);

// Texture (left eye default)
texture.repeat.set(0.5, 1);
texture.offset.set(0, 0);

// 2D viewer
sphere.rotation.y = Math.PI;

// VR headset (looks at -Z)
sphere.rotation.y = -Math.PI / 2;

// Stereo eye switching
sphere.onBeforeRender = (_r, _s, cam) => {
  texture.offset.x = (xr.isPresenting && cam.viewport?.x > 0) ? 0.5 : 0.0;
};
```
