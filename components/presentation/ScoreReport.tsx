"use client";

import { Trophy, TrendingUp, MessageSquare, Clock, Star, CheckCircle, AlertCircle, Activity, Zap } from "lucide-react";
import type { AIScore } from "@/types";

function ScoreRingLarge({ value, max = 100 }: { value: number; max?: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#f59e0b" : "#ef4444";
  const glowColor = value >= 80 ? "rgba(34,197,94,0.4)" : value >= 60 ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)";
  return (
    <div className="relative w-[130px] h-[130px] shrink-0">
      <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[38px] font-black leading-none text-white">{value}</span>
        <span className="text-[11px] text-white/40 font-semibold tracking-wider">TOTAL</span>
      </div>
    </div>
  );
}

function ScoreRingSmall({ value, color, glow }: { value: number; color: string; glow: string }) {
  const r = 24, circ = 2 * Math.PI * r;
  const dash = (value / 25) * circ;
  return (
    <div className="relative w-[58px] h-[58px] shrink-0">
      <svg viewBox="0 0 56 56" className="-rotate-90 w-full h-full">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[17px] font-black text-white leading-none">{value}</span>
      </div>
    </div>
  );
}

const breakdown = [
  { label: "Filler Words", key: "fillerWords",    color: "#f43f5e", glow: "rgba(244,63,94,0.5)",  accent: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.2)",  underline: "#f43f5e", icon: MessageSquare },
  { label: "Fluency",      key: "fluency",        color: "#3b82f6", glow: "rgba(59,130,246,0.5)", accent: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.2)", underline: "#3b82f6", icon: TrendingUp },
  { label: "Structure",    key: "structure",      color: "#a855f7", glow: "rgba(168,85,247,0.5)", accent: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.2)", underline: "#a855f7", icon: Star },
  { label: "Time Mgmt",   key: "timeManagement", color: "#f59e0b", glow: "rgba(245,158,11,0.5)", accent: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)", underline: "#f59e0b", icon: Clock },
] as const;

export default function ScoreReport({ score, title, duration, slideCount }: {
  score: AIScore; title: string; duration: number; slideCount: number;
}) {
  const mins = Math.floor(duration / 60), secs = duration % 60;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #12122a 50%, #0d1117 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <div>
            <span className="text-white font-black text-[13px] tracking-wide">NIDA AI COACH</span>
            <span className="text-white/30 text-[11px] font-bold ml-2">V2.4</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <Activity size={11} className="text-emerald-400" />
          <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">Analysis Complete</span>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Overall score ── */}
        <div className="rounded-2xl p-5 flex items-center gap-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <ScoreRingLarge value={score.totalScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={15} className="text-amber-400" />
              <span className="text-white font-black text-[13px] tracking-widest uppercase">Performance Summary</span>
            </div>
            <p className="text-white/60 text-[13px] leading-relaxed">{score.overallFeedback}</p>
            <p className="text-white/25 text-[11px] mt-2 font-medium">{title} · {slideCount} slides · {mins}m {secs}s</p>
          </div>
        </div>

        {/* ── Breakdown ── */}
        <div className="grid grid-cols-4 gap-3">
          {breakdown.map(({ label, key, color, glow, accent, border, underline, icon: Icon }) => {
            const item = score.breakdown[key];
            return (
              <div key={key} className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
                style={{ background: accent, border: `1px solid ${border}` }}>
                <ScoreRingSmall value={item.score} color={color} glow={glow} />
                <div>
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Icon size={11} style={{ color }} />
                    <span className="text-white text-[12px] font-bold">{label}</span>
                  </div>
                  <div className="h-[2px] rounded-full mx-auto w-8" style={{ background: underline, opacity: 0.6 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filler words ── */}
        {score.fillerWordCount > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={13} className="text-rose-400" />
              <span className="text-white font-black text-[11px] tracking-widest uppercase">Filler Words</span>
              <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full text-rose-300" style={{ background: "rgba(244,63,94,0.2)" }}>
                {score.fillerWordCount} total
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(score.fillerWordDetail).map(([word, count]) => (
                count > 0 && (
                  <span key={word} className="text-[12px] font-bold px-3 py-1 rounded-xl text-rose-300"
                    style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.2)" }}>
                    {word} <span className="text-rose-500">×{count}</span>
                  </span>
                )
              ))}
            </div>
          </div>
        )}

        {/* ── Strengths & Improvements ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-black text-[10px] tracking-widest uppercase">Key Strengths</span>
            </div>
            <ul className="space-y-2">
              {score.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-white/70 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={12} className="text-amber-400" />
              <span className="text-amber-400 font-black text-[10px] tracking-widest uppercase">To Improve</span>
            </div>
            <ul className="space-y-2">
              {score.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-white/70 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-3 flex items-center justify-between border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <span className="text-white/20 text-[10px] font-bold tracking-widest uppercase">NIDA3DVR · Vision Engine V2.4.0</span>
        <span className="text-white/20 text-[10px] font-bold tracking-widest uppercase">CALL TO HIGHLIGHT · TAB TO SELECT</span>
      </div>
    </div>
  );
}
