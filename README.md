# NIDA3DVR — VR Presentation Training Platform

แพลตฟอร์มฝึกนำเสนองานในสภาพแวดล้อม Virtual Reality พร้อมระบบวิเคราะห์การพูดด้วย AI และการดูวิดีโอ 360°/180° แบบ immersive

**URL:** https://nida3dvr.vercel.app

---

## ภาพรวมระบบ

NIDA3DVR ถูกพัฒนาขึ้นเพื่อให้ผู้ใช้สามารถ:

1. **ดูวิดีโอ 180° SBS** ในสภาพแวดล้อม VR แบบ immersive ผ่าน WebXR
2. **ฝึกนำเสนองาน** ในโหมด VR โดยใช้ไฟล์ PDF เป็น slides พร้อมวิดีโอ background
3. **รับการวิเคราะห์** จาก AI ในด้าน Filler Words, Fluency, Structure, และ Time Management
4. **ตรวจวัดอัตราการเต้นหัวใจ** แบบ realtime ระหว่างนำเสนอ ผ่าน Web Bluetooth

---

## Tech Stack

| ส่วน | เทคโนโลยี | เวอร์ชัน |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | 5.x |
| UI Library | React | 18.3.1 |
| 3D / VR | Three.js + WebXR API | 0.183.2 |
| Styling | Tailwind CSS v4 | 4.2.2 |
| Storage | Cloudflare R2 (S3-compatible) | — |
| Database | Upstash Redis (REST API) | 1.37.0 |
| Speech-to-Text | Groq Whisper | `whisper-large-v3-turbo` |
| AI Analysis | Groq Llama | `llama-3.3-70b-versatile` |
| PDF Processing | PDF.js (browser-side) | 3.11.174 |
| Icons | Lucide React | 1.7.0 |
| Deploy | Vercel | — |

---

## Features

### 1. Home (`/`)
- แสดงวิดีโอสุ่ม 2 รายการจาก library พร้อม hero banner
- กดดูวิดีโอ 180° preview ได้ทันที หรือ Play in VR เข้า WebXR
- นับ views อัตโนมัติเมื่อเล่น

### 2. Video Library (`/videos`)
- รายการวิดีโอทั้งหมด: thumbnail, ชื่อ, ระยะเวลา, วันอัปโหลด, จำนวน views
- เล่นวิดีโอแบบ 180° preview หรือ VR fullscreen (WebXR)
- **Admin**: อัปโหลด MP4 (สูงสุด **3 GB**), แก้ไข title/description, ลบวิดีโอ
- Thumbnail สร้างอัตโนมัติจากเฟรมที่ 2 วินาที — ครอปกึ่งกลาง left eye (ไม่ fisheye)
- ตรวจสอบ spec ก่อนอัปโหลด: resolution, SBS aspect ratio, frame rate, codec

### 3. Presentations (`/presentations`)
- รายการ presentation sessions: slide count, score, วันอัปโหลด
- กดที่ card เพื่อดู **slide preview** ก่อนเข้า VR (Prev/Next + dots navigation)
- **Admin**: อัปโหลด PDF → แปลงเป็น JPEG slides ด้วย PDF.js ใน browser → อัปโหลดไป R2
- Score badge แสดงสีตามผล: เขียว ≥ 80 / เหลือง ≥ 60 / แดง < 60
- **Admin**: ลบ session ได้ผ่าน confirmation dialog

### 4. VR Speech Coach (`/vr-speech-coach`)
- เลือก **Presentation** (บังคับ) และ **VR Video background** (optional)
- เชื่อมต่อ **Heart Rate Monitor** (optional) ก่อนเข้า VR
- กด **Enter VR** เพื่อเริ่มฝึกนำเสนองาน

### 5. VR Presentation Mode
- Slides แสดงเป็น 3D plane ตรงกลางในระยะ 5 เมตร
- วิดีโอ 180° SBS เป็น background (ถ้าเลือก)
- บันทึกเสียง microphone ตลอดการนำเสนอ
- **HR overlay** แสดง BPM realtime ข้างๆ End button (ถ้าเชื่อมต่อนาฬิกา)
- กด **End** หรือ grip ค้าง 1 วิ → ออก VR → transcribe → AI วิเคราะห์ → แสดง Score Report

### 6. VR Video Mode
- วิดีโอ 180° SBS loop ใน VR environment
- กด controller → Exit button ปรากฏ → เล็ง → กด → ออก VR

### 7. Score Report
- Overall score 0–100 พร้อม progress ring
- 4 หมวดคะแนน (25 คะแนนต่อหมวด):

| หมวด | รายละเอียด |
|---|---|
| Filler Words | นับคำ เออ / อืม / แบบว่า / อ่า / คือ / ประมาณว่า |
| Fluency | ความลื่นไหลในการพูด |
| Structure | โครงสร้างการนำเสนอ intro–body–conclusion |
| Time Management | การใช้เวลาต่อสไลด์ |

- Strengths + Improvements + Overall feedback (AI-generated)

### 8. Heart Rate Monitor
- เชื่อมต่อผ่าน **Web Bluetooth API** — รองรับ Garmin Forerunner 165 และ BLE HR devices อื่นๆ
- แสดงค่า BPM realtime บนหน้าเว็บและ overlay ใน VR scene
- สีตามโซน: 🟢 < 100 bpm / 🟡 100–129 bpm / 🔴 ≥ 130 bpm

**วิธีใช้:**
1. สวมนาฬิกา + pair กับ **Garmin Connect app** บนมือถือก่อน
2. **เปิด activity** บนนาฬิกา (เพื่อให้ broadcast HR signal)
3. กด **HR Monitor** ในหน้า VR Speech Coach → เลือก Forerunner จากรายการ
4. กด **Enter VR** — HR จะแสดงใน VR scene แบบ realtime
5. กดปุ่ม **X** ข้างปุ่ม HR เพื่อ disconnect

> **หมายเหตุ:** Web Bluetooth รองรับเฉพาะ Meta Browser (Quest Pro/2/3) และ Chrome/Edge Desktop เท่านั้น — ไม่รองรับ Wolvic และ Safari

---

## Video Requirements

| รายการ | ค่าที่รองรับ |
|---|---|
| Format | MP4 (.mp4) |
| VR Type | Side-by-Side (SBS) 180° |
| Resolution | ขั้นต่ำ 1920×1080 · แนะนำ 3840×1920 (4K) |
| Aspect Ratio | ~2:1 (width ≈ 2× height) |
| Frame Rate | 24–60 fps |
| Codec | H.264 (AVC) |
| Audio | Stereo หรือ Spatial Audio |
| Max Size | **3 GB** |

---

## Browser & Device Compatibility

| ฟีเจอร์ | Meta Browser (Quest Pro/2/3) | Chrome / Edge Desktop | Safari | Wolvic |
|---|---|---|---|---|
| VR Mode (WebXR) | ✅ | ✅ | ❌ | ✅ |
| 180° Video Player | ✅ | ✅ | ✅ | ✅ |
| VR Speech Coach | ✅ | ✅ (ไม่มี VR headset) | ❌ | ✅ |
| Heart Rate Monitor | ✅ | ✅ | ❌ | ❌ |
| File Upload | ✅ | ✅ | ✅ | ✅ |

---

## VR Controls

### Presentation Mode

| Input | Action |
|---|---|
| Controller trigger / Select button | Next slide |
| Gamepad Button 4 | Previous slide |
| Gamepad Button 5 หรือ 0 | Next slide |
| Grip button ค้าง 1+ วินาที | End presentation → AI วิเคราะห์ |
| Arrow Right / B key | Next slide |
| Arrow Left / A key | Previous slide |
| กด End button (3D) | End presentation → AI วิเคราะห์ |
| ESC | ออกโดยไม่วิเคราะห์ |

### Video Mode

| Input | Action |
|---|---|
| ปุ่มใดๆ บน controller | Toggle Exit VR button |
| เล็งที่ Exit VR + กด | ออกจาก VR |
| ESC | ออกจาก VR |

---

## Architecture

### System Overview

```
Browser (Next.js)
    │
    ├── PDF.js           → render PDF → JPEG slides (client-side)
    ├── Three.js/WebXR   → VR rendering + interaction
    ├── Web Bluetooth    → Heart Rate Monitor (BLE)
    ├── MediaRecorder    → audio recording (WebM Opus)
    │
    ▼
Vercel (Next.js API Routes)
    │
    ├── /api/upload/presign-video    → presigned PUT URL
    ├── /api/upload/presign-slide    → presigned PUT URL per slide
    ├── /api/videos                  → CRUD video metadata
    ├── /api/presentation/session    → CRUD presentation sessions
    ├── /api/presentation/save-slides→ store slide URLs in Redis
    ├── /api/presentation/slides/[id]→ fetch slide URLs
    ├── /api/presentation/transcribe → Groq Whisper STT
    └── /api/presentation/analyze    → Groq Llama AI scoring
    │
    ├── Cloudflare R2  → ไฟล์วิดีโอ, thumbnail, slide images
    ├── Upstash Redis  → metadata, slide URLs, scores
    └── Groq API       → Whisper (STT) + Llama 3.3 (AI analysis)
```

### Upload Pipelines

**Video Upload:**
```
เลือกไฟล์ MP4
  → validate spec (client-side)
  → presign-video API → R2 presigned URL
  → XHR PUT ตรงไป R2 (progress tracking)
  → generate thumbnail (canvas, 2s mark)
  → POST /api/videos (metadata + thumbnail → Redis)
```

**Presentation Upload:**
```
เลือกไฟล์ PDF
  → PDF.js render ทุกหน้า → JPEG (scale 2.5, quality 0.92)
  → POST /api/presentation/session (สร้าง sessionId)
  → for each slide:
      presign-slide API → R2 presigned URL → PUT slide image
  → POST /api/presentation/save-slides (บันทึก URLs → Redis)
```

**VR Presentation Flow:**
```
Enter VR
  → บันทึกเสียง (MediaRecorder)
  → นำเสนอ slides + ดูวิดีโอ background + แสดง HR
  → End / grip 1s
  → ส่ง audio → /api/presentation/transcribe → Groq Whisper
  → ส่ง transcript → /api/presentation/analyze → Groq Llama 3.3
  → แสดง Score Report (4 หมวด + strengths + improvements)
```

---

## Data Storage Schema

### Redis Keys

| Key | Type | TTL | ข้อมูล |
|---|---|---|---|
| `videos:list` | List | ไม่หมดอายุ | Video IDs (LPUSH, newest first) |
| `video:{id}` | Hash | 1 ปี | id, title, r2Key, thumbnailKey, duration, size, uploadedAt, views, description |
| `sessions:list` | List | ไม่หมดอายุ | Session IDs |
| `session:{id}` | Hash | 30 วัน | id, title, slideCount, uploadedAt, score, endTime, duration |
| `session:{id}:slides` | List | 30 วัน | Slide image URLs (ตามลำดับ) |

### R2 Storage Structure

```
bucket/
├── videos/
│   └── {videoId}.mp4
├── thumbnails/
│   └── {videoId}.jpg
└── ppts/
    └── {sessionId}/
        ├── slide-000.jpg
        ├── slide-001.jpg
        └── ...
```

---

## Project Structure

```
nida3dvr/
├── app/
│   ├── page.tsx                         # Home
│   ├── layout.tsx                       # Root layout + AuthProvider
│   ├── videos/page.tsx                  # Video Library
│   ├── presentations/page.tsx           # Presentations + Slide Preview
│   ├── vr-speech-coach/page.tsx         # VR Speech Coach + HR Monitor
│   └── api/
│       ├── videos/
│       │   ├── route.ts                 # GET/POST videos
│       │   └── [id]/route.ts            # GET/PATCH/DELETE video
│       ├── upload/
│       │   ├── presign-video/route.ts   # Presigned URL สำหรับวิดีโอ
│       │   └── presign-slide/route.ts   # Presigned URL สำหรับ slides
│       └── presentation/
│           ├── session/route.ts         # GET/POST/DELETE sessions
│           ├── save-slides/route.ts     # บันทึก slide URLs
│           ├── slides/[id]/route.ts     # ดึง slide URLs
│           ├── transcribe/route.ts      # Groq Whisper STT
│           └── analyze/route.ts         # Groq Llama AI scoring
├── components/
│   ├── layout/
│   │   └── MainLayout.tsx               # Sidebar + Bottom nav
│   ├── auth/
│   │   └── LoginModal.tsx               # Admin login/logout modal
│   ├── vr/
│   │   └── VRScene.tsx                  # Three.js + WebXR engine
│   ├── video/
│   │   ├── VideoCard.tsx                # Video grid card
│   │   ├── VideoUploadModal.tsx         # Upload + validate + progress
│   │   ├── VideoPlayer180.tsx           # 180° interactive player
│   │   └── VideoPlayerModal.tsx         # Popup video player
│   └── presentation/
│       ├── FileUpload.tsx               # PDF → slides → R2 upload
│       ├── PresentationCard.tsx         # Presentation grid card
│       └── ScoreReport.tsx              # AI score display
├── contexts/
│   └── AuthContext.tsx                  # Admin auth state (localStorage)
├── lib/
│   ├── r2.ts                            # Cloudflare R2 client (presign, delete, public URL)
│   ├── redis.ts                         # Upstash Redis client + TTL constants
│   ├── groq.ts                          # Groq Whisper transcription
│   └── gemini.ts                        # Groq Llama AI analysis (ชื่อไฟล์เดิม)
└── types/
    └── index.ts                         # TypeScript interfaces
```

---

## Admin Login

กดไอคอน **N** มุมล่างซ้าย sidebar → ใส่ username/password → Login

เมื่อ login แล้ว:
- จุดเขียวที่ไอคอน N
- ปุ่ม **Upload Video** และ **Upload Presentation** ปรากฏ
- ปุ่ม Edit/Delete บน card ปรากฏ

Session เก็บใน `localStorage` key: `nida3dvr_auth`

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
R2_PUBLIC_DOMAIN=        # เช่น https://pub-xxxx.r2.dev

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Groq API (Whisper + Llama)
GROQ_API_KEY=

# Admin credentials
NEXT_PUBLIC_ADMIN_USER=admin
NEXT_PUBLIC_ADMIN_PASS=nida2025
```

### 3. ตั้งค่า CORS บน R2 Bucket

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4. รัน development server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

### 5. ทดสอบบน Quest (ต้องใช้ HTTPS)

```bash
cloudflared tunnel --url http://localhost:3000
```

หรือผ่าน Local Network: `http://<your-ip>:3000`

---

## VR Projection (180° SBS) — Technical Detail

```js
// Hemisphere geometry
const geo = new THREE.SphereGeometry(500, 64, 32, Math.PI / 2, Math.PI);
geo.scale(-1, 1, 1);

// UV mapping: แสดงครึ่งซ้าย (left eye) เป็น default
texture.repeat.set(0.5, 1);
texture.offset.set(0, 0);

// 2D viewer rotation
sphere.rotation.y = Math.PI;

// VR headset rotation (looks at -Z)
sphere.rotation.y = -Math.PI / 2;

// Stereo eye switching
sphere.onBeforeRender = (_r, _s, cam) => {
  texture.offset.x = (xr.isPresenting && cam.viewport?.x > 0) ? 0.5 : 0.0;
};
```

---

## AI Analysis — Scoring Criteria

ระบบ AI วิเคราะห์การนำเสนอจาก transcript ที่ได้จาก Groq Whisper และข้อมูล session:

| หมวด | น้ำหนัก | เกณฑ์ |
|---|---|---|
| Filler Words | 25 คะแนน | นับคำฟุ่มเฟือย (เออ/อืม/แบบว่า/อ่า/คือ/ประมาณว่า) |
| Fluency | 25 คะแนน | ความลื่นไหล ความต่อเนื่อง ความชัดเจน |
| Structure | 25 คะแนน | มี intro, body, conclusion ชัดเจน |
| Time Management | 25 คะแนน | เวลาต่อสไลด์เหมาะสม ไม่เร็ว/ช้าเกิน |

- ใช้ **Groq Llama 3.3-70b-versatile** (temperature 0.3)
- หาก API ไม่ตอบสนอง: ใช้ fallback score จาก rule-based logic

---

## Limitations & Known Issues

| ข้อจำกัด | รายละเอียด |
|---|---|
| Safari | ไม่รองรับ WebXR — ใช้ดูวิดีโอ 180° แบบ 2D ได้ |
| Wolvic | รองรับ WebXR แต่ไม่มี Web Bluetooth |
| ไฟล์ขนาดใหญ่ | อัปโหลดตรงไป R2 (bypass server) — รองรับสูงสุด 3 GB |
| PDF ขนาดใหญ่ | render ใน browser อาจช้าถ้ามีหลายหน้า |
| Garmin HR | ต้อง pair กับ Garmin Connect app ก่อน + เปิด activity |
| Filler Words | ความแม่นยำขึ้นกับ Groq Whisper STT |
| Session TTL | Presentation sessions หมดอายุใน 30 วัน |
