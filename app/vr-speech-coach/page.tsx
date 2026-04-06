"use client";

import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import dynamic from "next/dynamic";
import { Headset, Video, FileText, Layers, Star, Clock, Play, CheckCircle2, X } from "lucide-react";
import ScoreReport from "@/components/presentation/ScoreReport";
import type { Video as VideoType, PresentationSession, AIScore } from "@/types";

const VRScene = dynamic(() => import("@/components/vr/VRScene"), { ssr: false });

type VRState = {
  slides: string[];
  sessionId: string;
  title: string;
  videoUrl?: string;
};

function fmt(s: number) { return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Video row ── */
function VideoRow({ video, selected, onSelect }: {
  video: VideoType;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all text-left ${
        selected
          ? "bg-brand-50 border-brand-200"
          : "border-transparent hover:bg-slate-50 hover:border-slate-100"
      }`}
    >
      <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-brand-50 to-slate-100 shrink-0">
        {video.thumbnailUrl
          ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Play size={16} className="text-brand-300" strokeWidth={1.5} />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold line-clamp-2 leading-snug ${selected ? "text-brand-700" : "text-slate-800"}`}>
          {video.title}
        </p>
        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
          <Clock size={10} /> {fmt(video.duration)} · {fmtDate(video.uploadedAt)}
        </span>
      </div>
      {selected
        ? <CheckCircle2 size={18} className="text-brand-600 shrink-0" />
        : <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
      }
    </button>
  );
}

/* ── Presentation row ── */
function PresentationRow({ session, selected, onSelect }: {
  session: PresentationSession;
  selected: boolean;
  onSelect: () => void;
}) {
  const scoreColor = session.score
    ? session.score.totalScore >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-100"
    : session.score.totalScore >= 60 ? "text-amber-600 bg-amber-50 border-amber-100"
    : "text-red-500 bg-red-50 border-red-100"
    : null;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all text-left ${
        selected
          ? "bg-brand-50 border-brand-200"
          : "border-transparent hover:bg-slate-50 hover:border-slate-100"
      }`}
    >
      <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-violet-50 to-slate-100 shrink-0">
        {session.slides[0]
          ? <img src={session.slides[0]} alt={session.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <FileText size={16} className="text-violet-300" strokeWidth={1.5} />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold line-clamp-2 leading-snug ${selected ? "text-brand-700" : "text-slate-800"}`}>
          {session.title}
        </p>
        <div className="flex items-center gap-2.5 mt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Layers size={10} /> {session.slideCount ?? session.slides.length} slides
          </span>
          {session.score && scoreColor && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${scoreColor}`}>
              <Star size={8} fill="currentColor" /> {session.score.totalScore}
            </span>
          )}
        </div>
      </div>
      {selected
        ? <CheckCircle2 size={18} className="text-brand-600 shrink-0" />
        : <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
      }
    </button>
  );
}

/* ── Main page ── */
export default function VRModePage() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [sessions, setSessions] = useState<PresentationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [selectedSession, setSelectedSession] = useState<PresentationSession | null>(null);
  const [vrState, setVrState] = useState<VRState | null>(null);
  const [scoreResult, setScoreResult] = useState<{
    score: AIScore; duration: number; title: string; slideCount: number;
  } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch("/api/videos"),
        fetch("/api/presentation/session"),
      ]);
      if (vRes.ok) setVideos((await vRes.json()).videos || []);
      if (pRes.ok) setSessions((await pRes.json()).sessions || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleEnterVR = async () => {
    if (!selectedSession) return;
    const res = await fetch(`/api/presentation/slides/${selectedSession.id}`);
    const data = res.ok ? await res.json() : {};
    setVrState({
      slides: data.slides || selectedSession.slides,
      sessionId: selectedSession.id,
      title: selectedSession.title,
      videoUrl: selectedVideo?.streamUrl,
    });
  };

  const handleVRDone = (result: { score?: AIScore; duration?: number }) => {
    const { title, slides } = vrState!;
    setVrState(null);
    if (result.score) {
      setScoreResult({ score: result.score, duration: result.duration || 0, title, slideCount: slides.length });
    }
    fetchAll();
  };

  /* VR active */
  if (vrState) {
    return (
      <VRScene
        mode="presentation"
        slides={vrState.slides}
        sessionId={vrState.sessionId}
        videoUrl={vrState.videoUrl}
        onExit={() => setVrState(null)}
        onDone={handleVRDone}
      />
    );
  }

  const canEnter = !!selectedSession;

  return (
    <MainLayout>

      {/* ── Teal Header ── */}
      <div className="bg-gradient-brand px-10 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">VR Speech Coach</h1>
          <p className="text-white/80 text-sm mt-1.5">
            Select a Presentation and VR Video, then press Enter VR
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full font-bold backdrop-blur-md transition-all text-sm border border-white/10 cursor-pointer">
            Learn More
          </button>
        </div>
      </div>

      {/* ── White Content ── */}
      <div className="bg-white min-h-[calc(100vh-148px)] px-10 py-8">

        {/* Selected summary bar */}
        {(selectedSession || selectedVideo) && (
          <div className="flex items-center gap-3 mb-6 bg-brand-50 border border-brand-100 rounded-2xl px-5 py-3">
            <Headset size={16} className="text-brand-600 shrink-0" />
            <div className="flex-1 flex items-center gap-4 flex-wrap text-sm">
              {selectedSession && (
                <span className="flex items-center gap-1.5 text-brand-700 font-medium">
                  <FileText size={13} /> {selectedSession.title}
                </span>
              )}
              {selectedVideo && (
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-slate-300">+</span>
                  <Video size={13} /> {selectedVideo.title}
                </span>
              )}
            </div>
            <button
              onClick={handleEnterVR}
              disabled={!canEnter}
              className="flex items-center gap-1.5 btn-primary text-xs px-4 py-2 shrink-0 disabled:opacity-40"
            >
              <Headset size={12} /> Enter VR
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[0, 1].map((col) => (
              <div key={col} className="rounded-2xl border border-slate-100 p-5 space-y-3 animate-pulse">
                <div className="h-3.5 w-1/3 bg-slate-100 rounded-full" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-24 aspect-video bg-slate-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-2.5 bg-slate-50 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">

            {/* Presentations — required */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  <FileText size={14} className="text-violet-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Presentation</p>
                  <p className="text-[10px] text-slate-400">{sessions.length} available · AI analysis included</p>
                </div>
                {selectedSession && (
                  <button onClick={() => setSelectedSession(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="p-2 max-h-[420px] overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText size={26} className="text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-slate-400 font-medium">Start sharing your presentation</p>
                    <p className="text-xs text-slate-300 mt-0.5">Upload from Presentations page</p>
                  </div>
                ) : (
                  sessions.map((s) => (
                    <PresentationRow
                      key={s.id}
                      session={s}
                      selected={selectedSession?.id === s.id}
                      onSelect={() => setSelectedSession(selectedSession?.id === s.id ? null : s)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Videos — optional background */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Video size={14} className="text-brand-700" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">VR Video</p>
                  <p className="text-[10px] text-slate-400">{videos.length} available · 180° VR</p>
                </div>
                {selectedVideo && (
                  <button onClick={() => setSelectedVideo(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="p-2 max-h-[420px] overflow-y-auto">
                {videos.length === 0 ? (
                  <div className="py-12 text-center">
                    <Video size={26} className="text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-slate-400 font-medium">Start sharing your video</p>
                    <p className="text-xs text-slate-300 mt-0.5">Upload from Videos page</p>
                  </div>
                ) : (
                  videos.map((v) => (
                    <VideoRow
                      key={v.id}
                      video={v}
                      selected={selectedVideo?.id === v.id}
                      onSelect={() => setSelectedVideo(selectedVideo?.id === v.id ? null : v)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score modal */}
      {scoreResult && (
        <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
            <button onClick={() => setScoreResult(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors z-10">
              <X size={18} />
            </button>
            <div className="p-6">
              <ScoreReport
                score={scoreResult.score}
                title={scoreResult.title}
                duration={scoreResult.duration}
                slideCount={scoreResult.slideCount}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
