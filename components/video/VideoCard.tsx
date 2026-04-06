"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Clock, Trash2, MoreHorizontal, Pencil, X, Check, Loader2 } from "lucide-react";
import type { Video } from "@/types";

function fmt(s: number) { return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VideoCard({ video, onPlay, onPlayVR, onDelete, onUpdate }: {
  video: Video;
  onPlay: () => void;
  onPlayVR: (v: Video) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, title: string, description: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [views, setViews] = useState<number>(video.views ?? 0);
  const [showDesc, setShowDesc] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);
  const [editDesc, setEditDesc] = useState(video.description ?? "");
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menu]);

  function handlePlay() {
    onPlay();
    fetch(`/api/videos/${video.id}`, { method: "PATCH" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.views != null) setViews(data.views); })
      .catch(() => {});
  }

  function openEdit() {
    setEditTitle(video.title);
    setEditDesc(video.description ?? "");
    setEditing(true);
    setMenu(false);
  }

  async function saveEdit() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() }),
      });
      onUpdate?.(video.id, editTitle.trim(), editDesc.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 group">

        {/* Thumbnail */}
        <div
          className="relative aspect-video cursor-pointer overflow-hidden rounded-t-2xl"
          onClick={handlePlay}
        >
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-50 via-slate-50 to-slate-100 flex items-center justify-center">
              <Play size={32} className="text-brand-200" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-sm">
            {fmt(video.duration)}
          </div>
          <div className="absolute top-2 left-2 bg-brand-700/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide backdrop-blur-sm">
            180° VR
          </div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center">
              <Play size={18} className="text-brand-700 ml-0.5" fill="#e84a5a" strokeWidth={0} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 flex-1 cursor-pointer hover:text-brand-700 transition-colors"
              onClick={handlePlay}
            >
              {video.title}
            </h3>

            {/* Manage menu */}
            <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenu(!menu)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <MoreHorizontal size={15} />
              </button>
              {menu && (
                <div className="absolute right-0 top-7 z-20 bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={openEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => { onDelete(video.id); setMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <span className="flex items-center gap-1 text-[11px] text-slate-400 flex-wrap">
            <Clock size={10} strokeWidth={1.8} />
            {fmtDate(video.uploadedAt)}
            {views > 0 && <span className="ml-1">· {views.toLocaleString()} views</span>}
            {video.description && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDesc(v => !v); }}
                className="ml-1 text-brand-500 hover:text-brand-700 font-medium cursor-pointer transition-colors"
              >
                {showDesc ? "...less" : "...more"}
              </button>
            )}
          </span>

          {showDesc && video.description && (
            <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
              <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Edit Video</h2>
              <button onClick={() => setEditing(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="input w-full resize-none"
                  placeholder="Enter description..."
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 btn-secondary justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editTitle.trim() || saving}
                  className="flex-1 btn-primary justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
