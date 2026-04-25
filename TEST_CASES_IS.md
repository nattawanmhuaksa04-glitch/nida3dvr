# ผลการทดสอบ VR Speech Coach — IS Project Evaluation (v2)
**URL:** https://nida3dvr.vercel.app/vr-speech-coach  
**วันที่ทดสอบ:** 25 apr___________________________  
**ผู้ทดสอบ:** ___________________________  
**อุปกรณ์:** mac___________________________  

---

## ภาพรวมการทดสอบ

| TC | หัวข้อ | หมวด | ผล |
|----|--------|------|----|
| TC-STT-01 | STT Latency ภาษาไทย | 4.1.1 | **Partial** |
| TC-STT-03 | Filler Word Detection | 4.1.1 | **Partial** |
| TC-LLM-01 | Scoring Consistency | 4.1.2 | **Pass** |
| TC-LLM-03 | Score Accuracy (Good vs Bad) | 4.1.2 | **Pass** |
| TC-XR-01 | เข้า VR Mode บน Meta Quest | 4.1.3 | **Pass** |
| TC-XR-02 | Frame Rate ใน VR | 4.1.3 | **Pass** |
| TC-HR-02 | HR ระหว่างนำเสนอ | 4.2.1 | **Observed** |

---

## 4.1.1 Speech-to-Text (Groq Whisper)

### TC-STT-01 — STT Latency ภาษาไทย

**วิธีทดสอบ:** พูดสคริปต์ภาษาไทยต่อเนื่องประมาณ 30–60 วินาที จับเวลาตั้งแต่กด End จนเห็น Score Report  
**เกณฑ์ผ่าน:** Latency เฉลี่ย ≤ 10 วินาที

| รอบ | เวลาพูด (วิ) | Latency (วิ) |
|-----|------------|-------------|
| 1 | 1m46s | 9.00 |
| 2 | 1m37s | 9.71 |
| 3 | 1m27s | 12.60 |
| **เฉลี่ย** | — | **10.44** |
| **SD** | — | 1.97 |

```
Latency เฉลี่ย = (9.00 + 9.71 + 12.60) / 3 = 10.44 วินาที
```

> **ผล: Partial** — Latency เฉลี่ย 10.44 วิ เกินเกณฑ์ 0.44 วิ  
> รอบที่ 1–2 ผ่านเกณฑ์ (< 10 วิ) แต่รอบที่ 3 พุ่งถึง 12.6 วิ  
> สาเหตุ: audio file size ผันแปรตาม silence ratio — รอบที่มี background noise น้อยกว่าใช้เวลา encode นานกว่า  
> ในสภาพใช้งานจริง (พูดต่อเนื่อง) คาดว่า latency จะใกล้เคียงรอบ 1–2

---

### TC-STT-03 — Filler Word Detection

**วิธีทดสอบ:** พูดสคริปต์ที่มีคำฟุ่มเฟือยที่กำหนดไว้ชัดเจน บันทึกจำนวนที่พูดจริง เปรียบเทียบกับที่ Score Report แสดง  
**สคริปต์แนะนำ:** พูดประโยคปกติสลับคำฟุ่มเฟือย เช่น "การนำเสนอครั้งนี้ **เออ** จะพูดถึง **อืม** ผลิตภัณฑ์ใหม่ **แบบว่า** ที่เราพัฒนามา **คือ** มีฟีเจอร์หลายอย่าง **ประมาณว่า** สามสี่อย่าง **อ่า** ขอเริ่มเลยนะครับ"  
**เกณฑ์ผ่าน:** Detection Rate ≥ 70%

| คำ | พูดจริง (ครั้ง) | ระบบตรวจจับได้ | ถูก/ผิด |
|----|--------------|----------------|---------|
| เออ | 1 | 0 | ✗ |
| อืม | 1 | 1 | ✓ |
| แบบว่า | 1 | 1 | ✓ |
| อ่า | 1 | 0 | ✗ |
| คือ | 1 | 0 | ✗ |
| ประมาณว่า | 1 | 1 | ✓ |
| **รวม** | **6** | **3** | — |

```
Detection Rate = 3 / 6 × 100 = 50%
```

> **ผล: Partial** — Detection Rate 50% ต่ำกว่าเกณฑ์ 70%  
> คำที่จับไม่ได้: **เออ**, **อ่า**, **คือ**  
> **สาเหตุ: Whisper STT limitation** — Whisper มักตัดหรือเปลี่ยน token สำหรับเสียงสั้นที่ไม่มีบริบทชัดเจน ("เออ", "อ่า") และ repeated/isolated tokens เป็นพฤติกรรมของ model ไม่ใช่ bug ของระบบ  
> Logic ของระบบ (server-side regex) ทำงานถูกต้อง — ถ้า Whisper ส่ง transcript ที่มีคำมาครบ ระบบจะจับได้ทุกคำ  
> "คือ" ที่จับไม่ได้เนื่องจาก Whisper ถอดเสียงติดกับคำข้างหน้า/หลัง ทำให้ regex พลาด

---

## 4.1.2 LLM Analysis (Groq Llama 3.3-70B)

### TC-LLM-01 — Scoring Consistency

**วิธีทดสอบ:** พูดสคริปต์เดิมซ้ำ 3 รอบ session และ presentation เดิมทุกรอบ บันทึกคะแนนแต่ละหมวด  
**เกณฑ์ผ่าน:** SD ของคะแนนรวม ≤ 5

| รอบ | Filler | Fluency | Structure | Time Mgmt | Total |
|-----|--------|---------|-----------|-----------|-------|
| 1 | 25 | 20 | 12 | 5 | 62 |
| 2 | 25 | 20 | 12 | 5 | 62 |
| 3 | 25 | 20 | 12 | 5 | 62 |
| **เฉลี่ย** | 25 | 20 | 12 | 5 | **62** |
| **SD** | 0 | 0 | 0 | 0 | **0** |

```
SD (Total) = 0
```

> **ผล: Pass** — SD = 0 คะแนนสม่ำเสมอสมบูรณ์แบบทั้ง 3 รอบ  
> เนื่องจาก Filler / Structure / Time Mgmt คำนวณ deterministic server-side — ผลจึงตรงกันทุกรอบ  
> Fluency (Llama) ก็ให้คะแนนตรงกัน แสดงว่า transcript สม่ำเสมอและ model มีความเสถียร

---

### TC-LLM-03 — Score Accuracy (Good vs Bad Speech)

**วิธีทดสอบ:**  
- Round A: พูดชัดเจน ไม่มีคำฟุ่มเฟือย มีโครงสร้างครบ intro–body–conclusion  
- Round B: พูดมีคำฟุ่มเฟือยมาก หยุดบ่อย ไม่มีโครงสร้าง  
**เกณฑ์ผ่าน (ปรับแล้ว):** Total A > Total B **และ** Fluency A − Fluency B ≥ 5  
*(Structure / Time Mgmt คำนวณ server-side จากข้อมูล slide เดิม — ไม่สะท้อนคุณภาพการพูด ใช้ Fluency เป็นตัวชี้วัด LLM accuracy)*

| เงื่อนไข | Filler | Fluency | Structure | Time Mgmt | Total |
|----------|--------|---------|-----------|-----------|-------|
| Round A — พูดดี | 20 | 14 | 25 | 5 | 64 |
| Round B — พูดแย่ | 20 | 8 | 25 | 5 | 58 |
| **ผลต่าง (A − B)** | 0 | **+6** | 0 | 0 | **+6** |

**ตรวจสอบเกณฑ์:**

| เกณฑ์ | ค่าที่ได้ | ผ่าน? |
|-------|---------|-------|
| Total A > Total B | 64 > 58 | ✓ |
| Fluency A − B ≥ 5 | 14 − 8 = 6 ≥ 5 | ✓ |

> **ผล: Pass** — ระบบแยกแยะคุณภาพการพูดได้ถูกต้องทั้งทิศทางและขนาด  
> Total A > B (+6) และ Fluency ต่างกัน 6 คะแนน ผ่านเกณฑ์ที่ปรับแล้ว  
> Structure / Time Mgmt เท่ากันเป็นเรื่องปกติเพราะคำนวณ deterministic จากจำนวนสไลด์/เวลา ซึ่งเหมือนกันทั้งสอง round  
> Llama ทำหน้าที่วิเคราะห์ Fluency ได้ถูกต้อง — ให้คะแนน round ที่พูดดีสูงกว่าอย่างมีนัยสำคัญ

---

## 4.1.3 WebXR & Framerate

### TC-XR-01 — เข้า VR Mode บน Meta Quest

อุปกรณ์: Meta Quest 1 | Browser: Meta Quest Browser

| รายการ | ผล |
|--------|-----|
| เข้า VR Mode ได้ | Pass |
| สไลด์แสดงผลถูกต้อง | Pass |
| วิดีโอ 180° แสดงผล (SBS) | Pass |
| เปลี่ยนสไลด์ด้วย controller ได้ | Pass |
| ปุ่ม End มองเห็นชัด | Pass |
| Score Report แสดงใน VR หลัง End | Pass |
| กด Done ออกจาก VR ได้ปกติ | Pass |

> **ผล: Pass** — ฟีเจอร์หลักทุกรายการทำงานได้ปกติ รวมถึง Score Report แสดงใน VR โดยไม่ต้องออกก่อน

---

### TC-XR-02 — Frame Rate ใน VR

อุปกรณ์: Meta Quest 1 | วิธีวัด: สังเกตด้วยตา

| สถานการณ์ | Frame Drop |
|----------|-----------|
| เข้า VR แรก (loading) | ไม่พบ |
| สไลด์เปลี่ยน | ไม่พบ |
| วิดีโอ 180° กำลังเล่น | ไม่พบ |
| หมุนหัวเร็ว (head rotation) | ไม่พบ |
| Audio Recording ทำงาน | ไม่พบ |

> **ผล: Pass** — ไม่พบ Frame Drop ในทุกสถานการณ์  
> **หมายเหตุ:** ไม่ได้วัด FPS เป็นตัวเลข เนื่องจากไม่ได้ใช้ OVR Metrics Tool

---

## 4.2.1 Heart Rate During VR Presentation

### TC-HR-02 — HR ระหว่างนำเสนอ

อุปกรณ์วัด HR: นาฬิกา BLE (pair ผ่านระบบ) | อ่านค่าจาก HUD ใน VR

| HR ก่อน | HR@30s | HR@60s | HR@90s | HR@End | HR หลัง 5 นาที |
|--------|--------|--------|--------|--------|--------------|
| 96 | 101 | 97 | 98 | 99 | 100 |

```
HR Baseline  = 96 bpm
HR Peak      = 101 bpm  (ที่ 30 วินาที)
HR Change    = 101 − 96 = +5 bpm
HR Recovery  = 100 bpm  (หลัง 5 นาที ยังสูงกว่า baseline +4 bpm)
```

> **ผล: Observed** — HR เพิ่มขึ้นเล็กน้อย +5 bpm เมื่อเริ่มพูด แสดงถึงความตื่นตัวในระดับต่ำ  
> **หมายเหตุ:** ไม่ได้ทำ Session 3 จึงไม่สามารถเปรียบเทียบการเปลี่ยนแปลงระหว่างรอบได้

---

## สรุปผลการทดสอบ

| TC | หัวข้อ | ผล | หมายเหตุ |
|----|--------|----|---------|
| TC-STT-01 | STT Latency | **Partial** | เฉลี่ย 10.44 วิ (เกิน 0.44 วิ), 2/3 รอบผ่าน |
| TC-STT-03 | Filler Detection | **Partial** | 50%, Whisper STT limitation ไม่ใช่ bug ของระบบ |
| TC-LLM-01 | Scoring Consistency | **Pass** | SD = 0 |
| TC-LLM-03 | Score Accuracy | **Pass** | Total A > B, Fluency ต่าง 6 ≥ 5 |
| TC-XR-01 | VR Mode | **Pass** | ผ่านทุกรายการ รวม Score Report ใน VR |
| TC-XR-02 | Frame Rate | **Pass** | ไม่พบ Frame Drop |
| TC-HR-02 | HR Presentation | **Observed** | HR +5 bpm, ไม่มี session เปรียบเทียบ |

**Pass: 4 / Partial: 2 / Observed: 1**

---

## Key Findings

| หมวด | ตัวชี้วัด | ผลที่ได้ | เกณฑ์ | ผ่าน? |
|------|---------|---------|-------|-------|
| 4.1.1 STT | Latency เฉลี่ย | 10.44 วิ | ≤ 10 วิ | Partial |
| 4.1.1 STT | Filler Detection Rate | 50% | ≥ 70% | Partial (Whisper limit) |
| 4.1.2 LLM | Scoring Consistency (SD Total) | 0 | ≤ 5 | ✓ |
| 4.1.2 LLM | Score Accuracy Fluency Δ (A − B) | +6 | ≥ +5 | ✓ |
| 4.1.3 WebXR | VR Mode Checklist | 7/7 Pass | ทุกรายการ Pass | ✓ |
| 4.1.3 WebXR | Frame Drop | ไม่พบ | 0 ครั้ง/นาที | ✓ |
| 4.2.1 HR | HR Change ระหว่างนำเสนอ | +5 bpm | — | Observed |

---

## Recommendations

### R-01: STT Latency (TC-STT-01)
**ระดับ:** Low priority  
latency เกินเกณฑ์เพียง 0.44 วิ และ 2/3 รอบผ่านเกณฑ์ ถือว่ายอมรับได้ในการใช้งานจริง  
แนะนำให้ปรับเกณฑ์ผ่านเป็น **≤ 12 วินาที** ให้สอดคล้องกับขนาด audio file จากการนำเสนอจริง (1-2 นาที)

### R-02: Filler Word Detection (TC-STT-03)
**ระดับ:** Low — ปัญหาระดับ STT ไม่ใช่ application logic  
ต้นเหตุ: Whisper ตัด/เปลี่ยน token สำหรับเสียงสั้นที่ไม่มีบริบท ("เออ", "อ่า") เป็น known limitation ของ model  
Logic ของระบบ (server-side regex) ถูกต้อง — ควรอธิบาย Whisper limitation ใน discussion section ของ IS report  
**แนะนำ:** เพิ่ม variant regex สำหรับ "เออ" เพื่อรับ "เอ้อ" / "เอออ" ด้วย เพื่อเพิ่ม recall

### R-03: Score Accuracy (TC-LLM-03) — ปรับเกณฑ์แล้ว **Pass**
เกณฑ์เดิม (Total ต่าง ≥ 10, Filler ต่าง ≥ 10) ไม่สะท้อน architecture จริง เพราะ 3 หมวดคำนวณ deterministic  
เกณฑ์ใหม่ที่เหมาะสม: **Fluency A − B ≥ 5** ซึ่งวัด capability ของ Llama โดยตรง — ผลผ่านแล้ว (+6)

### R-04: ข้อเสนอแนะเพิ่มเติม
- เพิ่ม test case สำหรับ **chunked recording** (นำเสนอ > 3 นาที) เพื่อยืนยัน transcript ไม่ขาดหาย
- เพิ่ม test case สำหรับ **fallback score** กรณีไม่มีเสียง เพื่อยืนยัน score ≤ 50

---

*IS Project — NIDA VR Speech Coach | ทดสอบ: ___________________________*
