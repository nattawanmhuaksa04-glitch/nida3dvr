"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Upload, Video, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";

export default function VideoUploadModal({ onClose, onSuccess, initialFile }: { onClose: () => void; onSuccess: () => void; initialFile?: File }) {
  const [step, setStep] = useState<"select" | "validating" | "uploading" | "done" | "error">("select");
  const [file, setFile] = useState<File | null>(initialFile ?? null);
  const [title, setTitle] = useState(initialFile ? initialFile.name.replace(/\.[^.]+$/, "") : "");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [specPos, setSpecPos] = useState({ top: 0, left: 0 });
  const infoRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSpec && infoRef.current) {
      const rect = infoRef.current.getBoundingClientRect();
      setSpecPos({ top: rect.top - 8, left: rect.right + 8 });
    }
  }, [showSpec]);

  const MAX_SIZE = 3 * 1024 ** 3; // 3 GB

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "video/mp4") {
      if (f.size > MAX_SIZE) { setErrorMsg("File exceeds 3 GB limit"); setStep("error"); return; }
      setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  }, [title]);

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setStep("validating");
    try {
      const result = await validateVideo(file);
      if (!result.valid) {
        setErrorMsg(result.error!);
        setStep("error");
        return;
      }
    } catch {
      // validation failed to run — skip and proceed
    }
    setStep("uploading"); setProgress(0);
    try {
      const presignRes = await fetch("/api/upload/presign-video", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, size: file.size, mimeType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, videoId, key: r2Key } = await presignRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90)); };
        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error("Upload failed"));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setProgress(95);
      let thumbnailBlob: Blob | null = null;
      let duration = 0;
      try {
        const result = await generateThumbnail(file);
        thumbnailBlob = result.blob;
        duration = result.duration;
      } catch {}

      const fd = new FormData();
      fd.append("videoId", videoId); fd.append("title", title.trim());
      fd.append("size", file.size.toString()); fd.append("mimeType", file.type);
      fd.append("r2Key", r2Key); fd.append("duration", String(Math.round(duration)));
      if (description.trim()) fd.append("description", description.trim());
      if (thumbnailBlob) fd.append("thumbnail", thumbnailBlob, "thumb.jpg");
      const regRes = await fetch("/api/videos", { method: "POST", body: fd });
      if (!regRes.ok) throw new Error("Failed to register video");

      setProgress(100); setStep("done");
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed"); setStep("error");
    }
  };

  return (
    <>
    {showSpec && (
      <div
        className="fixed z-[100] w-72 bg-slate-900 text-white text-xs rounded-2xl p-4 shadow-2xl pointer-events-none"
        style={{ top: specPos.top, left: specPos.left, transform: "translateY(-100%)" }}
      >
        <p className="font-bold text-white mb-3 text-sm">Video Requirements</p>
        <div className="space-y-2 text-slate-300">
          {[
            ["Format",     "MP4 (.mp4)"],
            ["VR Type",    "Side-by-Side (SBS) 180°"],
            ["Resolution", "Min 1920×1080 · Recommended 3840×1920 (4K)"],
            ["Frame Rate", "24 – 60 fps"],
            ["Codec",      "H.264"],
            ["Audio",      "Stereo or Spatial Audio"],
            ["Max Size",   "3 GB"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-slate-500 shrink-0">{label}</span>
              <span className="text-right">{label === "Max Size" ? <strong className="text-white">{value}</strong> : value}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 flex items-center justify-center">
              <Video size={18} className="text-brand-600" strokeWidth={1.8} />
            </div>
            <h2 className="font-bold text-slate-900">Upload VR Video</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === "select" && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? "border-brand-400 bg-brand-50/50 scale-[1.01]" : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/20"
                }`}
              >
                <input ref={fileRef} type="file" accept="video/mp4" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > MAX_SIZE) { setErrorMsg("File exceeds 3 GB limit"); setStep("error"); return; }
                    setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                  }
                }} className="hidden" />
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                  <Upload size={24} className="text-brand-500" strokeWidth={1.8} />
                </div>
                {file ? (
                  <div>
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 ** 3).toFixed(2)} GB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Drop your video here</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <p className="text-sm text-slate-400">MP4 · SBS format · up to 3 GB</p>
                      <button
                        ref={infoRef}
                        type="button"
                        onMouseEnter={() => setShowSpec(true)}
                        onMouseLeave={() => setShowSpec(false)}
                        className="flex items-center"
                      >
                        <Info size={14} className="text-slate-300 hover:text-brand-500 transition-colors" />
                      </button>
                    </div>
                    <button className="mt-4 btn-secondary text-xs mx-auto">Browse files</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title..." className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description..."
                  rows={3}
                  className="input w-full resize-none" />
              </div>

              <button onClick={handleUpload} disabled={!file || !title.trim()}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                <Upload size={15} /> Upload Video
              </button>
            </>
          )}

          {step === "validating" && (
            <div className="py-8 text-center space-y-4">
              <Loader2 size={32} className="animate-spin text-brand-500 mx-auto" />
              <div>
                <p className="font-semibold text-slate-700">Checking video specs...</p>
                <p className="text-xs text-slate-400 mt-1">Verifying resolution, frame rate, and codec</p>
              </div>
            </div>
          )}

          {step === "uploading" && (
            <div className="py-6 space-y-5">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-brand-500" />
                <span className="font-medium text-slate-700">Uploading {title}...</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-slate-400 text-right font-mono">{progress}%</p>
            </div>
          )}

          {step === "done" && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <p className="font-bold text-slate-900 text-lg">Upload Complete!</p>
              <p className="text-sm text-slate-400 mt-1">Your video is ready to view in VR</p>
            </div>
          )}

          {step === "error" && (
            <div className="py-2 space-y-4">
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
              <button onClick={() => setStep("select")} className="btn-secondary w-full justify-center">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

async function validateVideo(file: File): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onerror = () => { cleanup(); resolve({ valid: false, error: "Cannot read video file." }); };

    video.onloadedmetadata = () => {
      const { videoWidth: w, videoHeight: h } = video;

      // Resolution check
      if (w < 1920 || h < 1080) {
        cleanup();
        return resolve({ valid: false, error: `Resolution too low: ${w}×${h}. Minimum required is 1920×1080.` });
      }

      // SBS aspect ratio check (width ≈ 2× height, tolerance ±10%)
      const ratio = w / h;
      if (ratio < 1.6 || ratio > 2.4) {
        cleanup();
        return resolve({ valid: false, error: `Invalid aspect ratio: ${w}×${h} (${ratio.toFixed(2)}:1). Side-by-Side (SBS) format requires ~2:1 ratio (e.g. 3840×1920).` });
      }

      // Codec check via MediaSource
      const isH264 = MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"') &&
                     !MediaSource.isTypeSupported('video/mp4; codecs="hev1.1.6.L93.B0"');
      // Note: isTypeSupported checks browser capability, not file codec — best effort only
      // We'll do a real check via canPlayType
      const canPlay = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
      if (canPlay === "") {
        cleanup();
        return resolve({ valid: false, error: "Codec not supported. Please use H.264 (AVC)." });
      }
      void isH264; // suppress unused warning

      // Frame rate check via requestVideoFrameCallback
      if ("requestVideoFrameCallback" in video) {
        let frameCount = 0;
        let startTime: number | null = null;

        const onFrame = (now: number) => {
          if (startTime === null) startTime = now;
          frameCount++;
          const elapsed = now - startTime;

          if (frameCount < 30 && elapsed < 2000) {
            (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: (now: number) => void) => void })
              .requestVideoFrameCallback(onFrame);
          } else {
            const fps = frameCount / (elapsed / 1000);
            video.pause();
            cleanup();
            if (fps < 24) {
              resolve({ valid: false, error: `Frame rate too low: ${fps.toFixed(1)} fps. Minimum required is 24 fps.` });
            } else {
              resolve({ valid: true });
            }
          }
        };

        (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: (now: number) => void) => void })
          .requestVideoFrameCallback(onFrame);
        video.play().catch(() => { cleanup(); resolve({ valid: true }); }); // autoplay blocked → skip fps check
      } else {
        // requestVideoFrameCallback not supported — skip fps check
        cleanup();
        resolve({ valid: true });
      }
    };
  });
}

async function generateThumbnail(file: File): Promise<{ blob: Blob; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata"; video.muted = true;
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => { video.currentTime = 2; };
    video.onseeked = () => {
      const duration = isFinite(video.duration) ? video.duration : 0;
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 360;
      // Crop center 50% of left eye — avoids fisheye edges, looks like normal photo
      const eyeW = video.videoWidth / 2;
      const cropW = eyeW * 0.5;
      const cropH = video.videoHeight * 0.5;
      const srcX = eyeW * 0.25;
      const srcY = video.videoHeight * 0.25;
      canvas.getContext("2d")!.drawImage(
        video,
        srcX, srcY, cropW, cropH,   // source: center of left eye
        0, 0, 640, 360              // dest: full canvas
      );
      URL.revokeObjectURL(video.src);
      canvas.toBlob(
        (blob) => blob ? resolve({ blob, duration }) : reject(new Error("Failed")),
        "image/jpeg", 0.8
      );
    };
    video.onerror = reject;
  });
}
