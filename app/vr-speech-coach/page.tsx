"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import dynamic from "next/dynamic";
import { Headset, Video, FileText, Layers, Star, Clock, Play, CheckCircle2, X, Heart, Info } from "lucide-react";
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
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [hrConnected, setHrConnected] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const hrRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hrDeviceRef = useRef<any>(null);

  useEffect(() => { if (heartRate !== null) hrRef.current = heartRate; }, [heartRate]);

  const connectHeartRate = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bt = (navigator as any).bluetooth;
    if (!bt) { alert("Web Bluetooth ไม่รองรับใน browser นี้"); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device: any = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["heart_rate"],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("heart_rate");
      const char = await service.getCharacteristic("heart_rate_measurement");
      await char.startNotifications();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      char.addEventListener("characteristicvaluechanged", (e: any) => {
        const val: DataView = e.target.value;
        const flags = val.getUint8(0);
        const hr = (flags & 0x1) ? val.getUint16(1, true) : val.getUint8(1);
        setHeartRate(hr);
        hrRef.current = hr;
      });
      hrDeviceRef.current = device;
      device.addEventListener("gattserverdisconnected", () => {
        setHrConnected(false); setHeartRate(null); hrRef.current = 0;
      });
      setHrConnected(true);
    } catch (err) { console.warn("HR connect failed:", err); }
  }, []);

  const disconnectHeartRate = useCallback(() => {
    hrDeviceRef.current?.gatt?.disconnect();
    setHrConnected(false); setHeartRate(null); hrRef.current = 0;
  }, []);

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
        heartRateRef={hrRef}
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
            Select a Presentation and VR Video, pair your HR watch (optional), then press Enter VR
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLearnMore(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full font-semibold backdrop-blur-md transition-all text-sm border border-white/20 cursor-pointer"
          >
            <Info size={14} /> Learn More
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
            <div className={`flex items-center shrink-0 rounded-xl border overflow-hidden transition-all ${
                !hrConnected
                  ? "bg-white border-slate-200"
                  : heartRate !== null && heartRate >= 130
                  ? "bg-red-50 border-red-300"
                  : heartRate !== null && heartRate >= 100
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-green-50 border-green-300"
              }`}>
              <button
                onClick={connectHeartRate}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 cursor-pointer transition-colors ${
                  !hrConnected
                    ? "text-slate-500 hover:text-red-400"
                    : heartRate !== null && heartRate >= 130
                    ? "text-red-600"
                    : heartRate !== null && heartRate >= 100
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                <Heart size={12} fill={hrConnected ? "currentColor" : "none"} />
                {hrConnected && heartRate ? `${heartRate} bpm` : hrConnected ? "Connected" : "HR Monitor"}
              </button>
              {hrConnected && (
                <button
                  onClick={disconnectHeartRate}
                  className="px-2 py-2 border-l border-current/20 text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X size={11} />
                </button>
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

      {/* Learn More modal */}
      {showLearnMore && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">VR Speech Coach</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Practice your presentation in Virtual Reality. AI analyzes your speech and gives targeted feedback to help you improve where it matters most.
                  </p>
                </div>
                <button onClick={() => setShowLearnMore(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="px-7 py-5 space-y-4 flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">How it works &nbsp;<span className="normal-case font-normal text-slate-300">* required</span></p>
              <div className="space-y-3">
                {[
                  { icon: <Video size={15} className="text-brand-600" />, title: "Upload a VR Video *", desc: "Go to Videos and upload an MP4 file in Side-by-Side 180° format. This becomes your immersive VR background." },
                  { icon: <FileText size={15} className="text-violet-600" />, title: "Upload a Presentation *", desc: "Go to Presentations and upload a PDF file. The system automatically converts each page into slides." },
                  { icon: <Heart size={15} className="text-rose-500" />, title: "Connect HR Watch", desc: "Click HR Monitor and select your BLE device (e.g. Garmin Forerunner) to monitor your heart rate live. Apple Watch is not supported." },
                  { icon: <Headset size={15} className="text-brand-600" />, title: "Select items and press Enter VR *", desc: "Select a Presentation (required) and a VR Video background, then click Enter VR." },
                  { icon: <Play size={15} className="text-emerald-600" />, title: "Press Enter VR again on the VR screen *", desc: "Once the video loads, click Enter VR on screen to go fully immersive on your headset." },
                  { icon: <Layers size={15} className="text-amber-500" />, title: "Present your slides *", desc: "Use controller buttons A / B to navigate slides forward and backward, or use the ‹ › buttons in VR." },
                  { icon: <Star size={15} className="text-brand-600" fill="currentColor" />, title: "Get your AI score *", desc: "On the last slide press Next once more, or press the End button — AI will analyze your speech and display your score instantly." },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300">{i + 1}</span>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Scoring */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Scoring Criteria — 100 pts total</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Filler Words", score: "25 pts", desc: "Counts filler words: uh / um / like / you know", color: "bg-rose-50 border-rose-100 text-rose-700" },
                    { label: "Fluency", score: "25 pts", desc: "Smoothness, continuity and clarity of speech", color: "bg-amber-50 border-amber-100 text-amber-700" },
                    { label: "Structure", score: "25 pts", desc: "Clear intro, body and conclusion", color: "bg-violet-50 border-violet-100 text-violet-700" },
                    { label: "Time Mgmt", score: "25 pts", desc: "Appropriate time per slide — not too fast or slow", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border p-3 ${item.color}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold">{item.label}</p>
                        <p className="text-[10px] font-semibold opacity-70">{item.score}</p>
                      </div>
                      <p className="text-[11px] opacity-80 leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3 text-center">Score: green ≥ 80 &nbsp;·&nbsp; yellow ≥ 60 &nbsp;·&nbsp; red &lt; 60</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 pb-7 pt-2">
              <button
                onClick={() => setShowLearnMore(false)}
                className="w-full btn-primary justify-center"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
