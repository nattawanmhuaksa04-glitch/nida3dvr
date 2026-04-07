"use client";

import { useState, useRef, useCallback } from "react";
import { FileText, Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function FileUpload({ onSlidesPrepared }: {
  onSlidesPrepared: (slides?: string[], sessionId?: string, title?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [step, setStep] = useState<"idle" | "rendering" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); }
  }, [title]);

  const handleProcess = async () => {
    if (!file) return;
    const effectiveTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");
    setStep("rendering"); setStatusMsg("Rendering slides..."); setProgress(10);
    try {
      const slides = await renderPdfToSlides(file, (p) => {
        setProgress(10 + Math.round(p * 60));
        setStatusMsg(`Rendering ${Math.round(p * 100)}%...`);
      });
      setStep("uploading"); setStatusMsg("Creating session..."); setProgress(75);
      const sessionRes = await fetch("/api/presentation/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: effectiveTitle, slideCount: slides.length }),
      });
      if (!sessionRes.ok) throw new Error("Failed to create session");
      const { sessionId } = await sessionRes.json();

      // Upload each slide to R2 and collect public URLs
      const slideUrls: string[] = [];
      for (let i = 0; i < slides.length; i++) {
        setStatusMsg(`Uploading slide ${i + 1} / ${slides.length}...`);
        setProgress(75 + Math.round((i / slides.length) * 20));
        const presignRes = await fetch("/api/upload/presign-slide", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, index: i }),
        });
        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, publicUrl } = await presignRes.json();
        // Convert base64 dataURL to blob
        const base64 = slides[i].split(",")[1];
        const blob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
        await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
        slideUrls.push(publicUrl);
      }

      setStatusMsg("Saving slides..."); setProgress(95);
      await fetch("/api/presentation/save-slides", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, slides: slideUrls }),
      });
      setProgress(100); setStep("done");
      onSlidesPrepared(slideUrls, sessionId, effectiveTitle);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Processing failed");
      setStep("error");
    }
  };

  if (step === "idle") return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragging ? "border-brand-400 bg-brand-50/50 scale-[1.01]" : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/20"
        }`}
      >
        <input ref={fileRef} type="file" accept=".pdf" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); }
        }} className="hidden" />
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <FileText size={24} className="text-brand-500" strokeWidth={1.8} />
        </div>
        {file ? (
          <div>
            <p className="font-semibold text-slate-800">{file.name}</p>
            <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-2 text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 mx-auto transition-colors">
              <X size={12} /> Remove
            </button>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-slate-700 mb-1">Drop your PDF here</p>
            <p className="text-sm text-slate-400">PDF only · Export PPTX as PDF before uploading</p>
            <button className="mt-4 btn-secondary text-xs mx-auto">Browse files</button>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter presentation title..." className="input w-full" />
      </div>
      <button onClick={handleProcess} disabled={!file}
        className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed">
        <Upload size={15} /> Process Presentation
      </button>
    </div>
  );

  if (step === "rendering" || step === "uploading") return (
    <div className="py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Loader2 size={20} className="animate-spin text-brand-500" />
        <span className="font-medium text-slate-700">{statusMsg}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm text-slate-400 text-right font-mono">{progress}%</p>
    </div>
  );

  if (step === "done") return (
    <div className="py-6 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 size={28} className="text-emerald-500" />
      </div>
      <p className="font-semibold text-slate-800">Slides ready!</p>
    </div>
  );

  return (
    <div className="py-2 space-y-3">
      <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
        <AlertCircle size={18} className="text-red-500 mt-0.5" />
        <p className="text-sm text-red-600">{errorMsg}</p>
      </div>
      <button onClick={() => { setStep("idle"); setFile(null); }} className="btn-secondary w-full justify-center">
        Try Again
      </button>
    </div>
  );
}

async function renderPdfToSlides(file: File, onProgress: (p: number) => void): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const slides: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    slides.push(canvas.toDataURL("image/jpeg", 0.92));
    onProgress(i / pdf.numPages);
  }
  return slides;
}
