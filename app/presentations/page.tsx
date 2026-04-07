"use client";

import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PresentationCard from "@/components/presentation/PresentationCard";
import FileUpload from "@/components/presentation/FileUpload";
import { Upload, FileText, X, RotateCcw, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { PresentationSession } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function PresentationsPage() {
  const { isLoggedIn } = useAuth();
  const [sessions, setSessions] = useState<PresentationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PresentationSession | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/presentation/session");
      if (res.ok) setSessions((await res.json()).sessions || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSlidesPrepared = () => {
    setShowUpload(false);
    fetchSessions();
  };

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/presentation/session?id=${deleteId}`, { method: "DELETE" });
    setSessions((s) => s.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <MainLayout>

      {/* ── Teal Header ── */}
      <div className="bg-gradient-brand px-10 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Presentations</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-white/80 text-sm font-medium">
              {loading ? "Loading…" : `${sessions.length} presentation${sessions.length !== 1 ? "s" : ""}`}
            </span>
            <button
              onClick={fetchSessions}
              className="p-1 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
        {isLoggedIn && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-white hover:bg-brand-50 text-brand-600 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm cursor-pointer"
          >
            <Upload size={15} strokeWidth={2} /> Upload Presentation
          </button>
        )}
      </div>

      {/* ── White Content ── */}
      <div className="bg-white min-h-[calc(100vh-148px)] px-10 py-8">

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="aspect-video bg-slate-100" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-2.5 bg-slate-50 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <div
            onClick={() => isLoggedIn && setShowUpload(true)}
            className={`border-2 border-dashed border-slate-200 rounded-3xl py-24 flex flex-col items-center gap-5 transition-all group ${isLoggedIn ? "hover:border-brand-400 hover:bg-brand-50/20 cursor-pointer" : "cursor-default"}`}
          >
            <div className="w-20 h-20 rounded-3xl bg-slate-50 group-hover:bg-brand-50 border border-slate-100 group-hover:border-brand-200 flex items-center justify-center transition-all">
              <div className="relative">
                <FileText size={30} className="text-slate-300 group-hover:text-brand-400 transition-colors" strokeWidth={1.5} />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-700 flex items-center justify-center shadow-sm">
                  <Upload size={9} className="text-white" strokeWidth={3} />
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-700 mb-1">Start sharing your presentation</p>
              <p className="text-sm text-slate-400">Click here to upload your first PDF file</p>
            </div>
            {isLoggedIn && (
              <button className="flex items-center gap-2 bg-brand-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-sm pointer-events-none">
                <Upload size={14} /> Upload Presentation
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-5">
            {sessions.map((s) => (
              <PresentationCard
                key={s.id}
                session={s}
                onEnterVR={async (s) => {
                setPreviewIdx(0);
                setPreviewLoading(true);
                const res = await fetch(`/api/presentation/slides/${s.id}`);
                const data = res.ok ? await res.json() : {};
                setPreview({ ...s, slides: data.slides || s.slides });
                setPreviewLoading(false);
              }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">{preview.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{previewIdx + 1} / {preview.slides.length} slides</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            {/* Slide */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 min-h-0">
              {previewLoading
                ? <Loader2 size={32} className="animate-spin text-brand-400" />
                : <img
                    src={preview.slides[previewIdx]}
                    alt={`Slide ${previewIdx + 1}`}
                    className="max-w-full max-h-full object-contain rounded-xl shadow"
                  />
              }
            </div>
            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setPreviewIdx((i) => Math.max(i - 1, 0))}
                disabled={previewIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <div className="flex gap-1.5">
                {preview.slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewIdx(i)}
                    className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${i === previewIdx ? "bg-brand-600" : "bg-slate-200 hover:bg-slate-400"}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setPreviewIdx((i) => Math.min(i + 1, preview.slides.length - 1))}
                disabled={previewIdx === preview.slides.length - 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Delete this presentation?</p>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <FileText size={17} className="text-brand-700" strokeWidth={1.8} />
                </div>
                <h2 className="font-bold text-slate-900">Upload Presentation</h2>
              </div>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <FileUpload onSlidesPrepared={handleSlidesPrepared} />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
