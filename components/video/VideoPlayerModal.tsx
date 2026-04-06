"use client";

import { useEffect } from "react";
import { X, Headset, Maximize2 } from "lucide-react";
import type { Video } from "@/types";
import VideoPlayer180 from "./VideoPlayer180";

function fmt(s: number) { return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`; }
function fmtSize(b: number) { const gb = b / 1024 ** 3; return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(b / 1024 ** 2).toFixed(0)} MB`; }

export default function VideoPlayerModal({ video, onClose, onPlayVR }: {
  video: Video;
  onClose: () => void;
  onPlayVR: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="font-bold text-slate-900 text-sm truncate">{video.title}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{fmt(video.duration)} · {fmtSize(video.size)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 180° Panoramic Player */}
        {video.streamUrl ? (
          <VideoPlayer180 src={video.streamUrl} />
        ) : (
          <div className="aspect-video bg-black flex flex-col items-center justify-center gap-3 text-slate-500">
            <Maximize2 size={32} strokeWidth={1.5} className="text-slate-600" />
            <p className="text-sm">Video not available</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">180° VR · Side-by-side format</p>
          <button
            onClick={onPlayVR}
            className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white text-xs font-semibold px-4 py-2 rounded-full transition-all"
          >
            <Headset size={13} strokeWidth={2} /> Open in VR Mode
          </button>
        </div>
      </div>
    </div>
  );
}
