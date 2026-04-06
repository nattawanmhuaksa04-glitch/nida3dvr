"use client";

import { Trophy, TrendingUp, MessageSquare, Clock, Star } from "lucide-react";
import type { AIScore } from "@/types";

function ScoreRing({ value, max = 25, color }: { value: number; max?: number; color: string }) {
  const r = 30, circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <svg width="80" height="80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#F1F5F9" strokeWidth="7" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

const breakdown = [
  { label: "Filler Words", key: "fillerWords",    color: "#ef4444", icon: MessageSquare },
  { label: "Fluency",      key: "fluency",        color: "#ff6b62", icon: TrendingUp },
  { label: "Structure",    key: "structure",      color: "#7c3aed", icon: Star },
  { label: "Time Mgmt",   key: "timeManagement", color: "#d97706", icon: Clock },
] as const;

export default function ScoreReport({ score, title, duration, slideCount }: {
  score: AIScore; title: string; duration: number; slideCount: number;
}) {
  const mins = Math.floor(duration / 60), secs = duration % 60;
  const totalCirc = 2 * Math.PI * 52;

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="pb-1 border-b border-slate-100">
        <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">{title}</h2>
        <p className="text-sm text-slate-400 mt-1 font-medium">{slideCount} slides · {mins}m {secs}s</p>
      </div>

      {/* ── Overall score ── */}
      <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 rounded-3xl p-6 flex items-center gap-7 border border-brand-100 shadow-sm">
        {/* Circle */}
        <div className="relative shrink-0 w-[120px] h-[120px]">
          <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="9" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#ff6b62" strokeWidth="9"
              strokeDasharray={`${(score.totalScore / 100) * totalCirc} ${totalCirc}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-4xl font-black text-slate-900 leading-none">{score.totalScore}</span>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">/ 100</span>
          </div>
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Trophy size={16} className="text-amber-500" />
            </div>
            <span className="text-base font-bold text-slate-900">Overall Score</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{score.overallFeedback}</p>
        </div>
      </div>

      {/* ── Breakdown ── */}
      <div className="grid grid-cols-2 gap-4">
        {breakdown.map(({ label, key, color, icon: Icon }) => {
          const item = score.breakdown[key];
          return (
            <div key={key} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 min-h-[100px]">
              {/* Ring */}
              <div className="relative shrink-0">
                <ScoreRing value={item.score} color={color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[15px] font-black" style={{ color }}>{item.score}</span>
                </div>
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={14} style={{ color }} strokeWidth={2} />
                  <span className="text-[13px] font-bold text-slate-800">{label}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.feedback}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filler words ── */}
      {score.fillerWordCount > 0 && (
        <div className="bg-red-50/60 border border-red-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <MessageSquare size={13} className="text-red-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              Filler Words
              <span className="ml-2 text-[11px] font-semibold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                {score.fillerWordCount} total
              </span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(score.fillerWordDetail).map(([word, count]) => (
              <span key={word} className="text-[12px] font-semibold bg-white text-red-600 border border-red-200 px-3 py-1 rounded-full shadow-sm">
                {word} <span className="text-red-400">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Strengths & Improvements ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Strengths</h4>
          </div>
          <ul className="space-y-2.5">
            {score.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-700 leading-snug">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-widest">To Improve</h4>
          </div>
          <ul className="space-y-2.5">
            {score.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-700 leading-snug">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
