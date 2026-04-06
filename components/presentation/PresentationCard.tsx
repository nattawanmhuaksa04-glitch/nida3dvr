"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Layers, MoreHorizontal, Trash2, Headset, Star } from "lucide-react";
import type { PresentationSession } from "@/types";

export default function PresentationCard({ session, onEnterVR, onDelete }: {
  session: PresentationSession;
  onEnterVR: (s: PresentationSession) => void;
  onDelete: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
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

  const scoreColor = session.score
    ? session.score.totalScore >= 80 ? { text: "text-emerald-600", bg: "bg-emerald-50" }
    : session.score.totalScore >= 60 ? { text: "text-amber-600",   bg: "bg-amber-50" }
    : { text: "text-red-600", bg: "bg-red-50" }
    : null;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={() => onEnterVR(session)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100 overflow-hidden rounded-t-2xl">
        {session.slides[0]
          ? <img src={session.slides[0]} alt={session.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
              <FileText size={32} className="text-brand-300" strokeWidth={1.5} />
            </div>
        }
        {/* Slide count */}
        <div className="absolute bottom-2.5 right-2.5 bg-slate-900/75 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded-lg flex items-center gap-1">
          <Layers size={10} strokeWidth={1.5} />
          {session.slideCount || session.slides.length}
        </div>
        {/* Score badge */}
        {session.score && scoreColor && (
          <div className={`absolute top-2.5 left-2.5 ${scoreColor.bg} rounded-full px-2 py-0.5 flex items-center gap-1`}>
            <Star size={10} className={scoreColor.text} fill="currentColor" />
            <span className={`text-[11px] font-bold ${scoreColor.text}`}>{session.score.totalScore}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-brand-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center">
            <Headset size={20} className="text-brand-700" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 flex-1">
            {session.title}
          </h3>
          <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenu(!menu)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <MoreHorizontal size={15} />
            </button>
            {menu && (
              <div className="absolute right-0 top-7 z-20 bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={() => { onDelete(session.id); setMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {new Date(session.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
