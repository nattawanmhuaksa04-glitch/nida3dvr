"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import MainLayout from "@/components/layout/MainLayout";
import VideoCard from "@/components/video/VideoCard";
import VideoUploadModal from "@/components/video/VideoUploadModal";
import VideoPlayerModal from "@/components/video/VideoPlayerModal";
import { Upload, RotateCcw, Trash2 } from "lucide-react";
import type { Video } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const VRScene = dynamic(() => import("@/components/vr/VRScene"), { ssr: false });

export default function VideosPage() {
  const { isLoggedIn } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | undefined>(undefined);
  const [isDragOver, setIsDragOver] = useState(false);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [vrVideo, setVrVideo] = useState<Video | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/videos");
      if (res.ok) setVideos((await res.json()).videos || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/videos/${deleteId}`, { method: "DELETE" });
    setVideos((v) => v.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  const handleUpdate = (id: string, title: string, description: string) => {
    setVideos((prev) => prev.map((v) => v.id === id ? { ...v, title, description } : v));
  };

  // Enter VR directly for this video
  if (vrVideo) {
    return (
      <VRScene
        mode="video"
        videoUrl={vrVideo.streamUrl || ""}
        onExit={() => setVrVideo(null)}
      />
    );
  }

  return (
    <MainLayout>

      {/* ── Teal Header ── */}
      <div className="bg-gradient-brand px-10 py-8 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">NIDA3DVR</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Video Library</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-white/80 text-sm font-medium">
              {loading ? "Loading…" : `${videos.length} video${videos.length !== 1 ? "s" : ""}`}
            </span>
            <button
              onClick={fetchVideos}
              className="p-1 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Refresh"
            >
              <RotateCcw size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
        {isLoggedIn && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-white hover:bg-brand-50 text-brand-600 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm cursor-pointer"
            >
              <Upload size={15} strokeWidth={2} /> Upload New Video
            </button>
          </div>
        )}
      </div>

      {/* ── White Content ── */}
      <div className="bg-white min-h-[calc(100vh-160px)] px-10 py-8">

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
        {!loading && videos.length === 0 && (
          <div
            onDragOver={(e) => { if (!isLoggedIn) return; e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setIsDragOver(false);
              if (!isLoggedIn) return;
              const f = e.dataTransfer.files[0];
              if (f && (f.type === "video/mp4" || f.type === "video/webm")) {
                setDroppedFile(f); setShowUpload(true);
              }
            }}
            className={`border-2 border-dashed rounded-3xl py-24 flex flex-col items-center gap-5 transition-all ${
              isDragOver ? "border-brand-400 bg-brand-50/40" : "border-brand-300 bg-brand-50/10"
            }`}
          >
            {/* Icon */}
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors relative ${isDragOver ? "bg-brand-100" : "bg-brand-50"} border border-brand-100`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b62" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center shadow-sm">
                <Upload size={10} className="text-white" strokeWidth={3} />
              </div>
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-base font-bold text-slate-700 mb-1">Start sharing your video</p>
              <p className="text-sm text-slate-400">Drag &amp; drop a video here, or click the button to browse</p>
            </div>

            {/* Button */}
            {isLoggedIn && (
              <button
                onClick={() => { setDroppedFile(undefined); setShowUpload(true); }}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-8 py-3 rounded-full transition-colors shadow-sm cursor-pointer"
              >
                <Upload size={14} strokeWidth={2.5} /> Upload New Video
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-3 gap-5">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                onPlay={() => setPlaying(v)}
                onPlayVR={(video) => setVrVideo(video)}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Delete this video?</p>
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
      {showUpload && (
        <VideoUploadModal onClose={() => { setShowUpload(false); setDroppedFile(undefined); }} onSuccess={fetchVideos} initialFile={droppedFile} />
      )}
      {playing && (
        <VideoPlayerModal
          video={playing}
          onClose={() => setPlaying(null)}
          onPlayVR={() => { setPlaying(null); setVrVideo(playing); }}
        />
      )}
    </MainLayout>
  );
}
