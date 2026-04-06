"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import MainLayout from "@/components/layout/MainLayout";
import VideoPlayerModal from "@/components/video/VideoPlayerModal";
import { Clock } from "lucide-react";
import type { Video } from "@/types";

const VRScene = dynamic(() => import("@/components/vr/VRScene"), { ssr: false });

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const CARD_COLORS = [
  "from-brand-500 to-brand-700",
  "from-blue-500 to-indigo-700",
  "from-orange-400 to-red-600",
  "from-purple-500 to-fuchsia-700",
];

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [vrVideo, setVrVideo] = useState<Video | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);

  const toggleDesc = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDesc(prev => prev === id ? null : id);
  }, []);

  function openVideo(video: Video) {
    setPlaying(video);
    fetch(`/api/videos/${video.id}`, { method: "PATCH" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.views != null) {
          setVideos((prev) =>
            prev.map((v) => v.id === video.id ? { ...v, views: data.views } : v)
          );
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetch("/api/videos")
      .then((r) => r.ok ? r.json() : { videos: [] })
      .then((data) => {
        const all: Video[] = data.videos ?? [];
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        setVideos(shuffled.slice(0, 2));
        setLoaded(true);
      })
      .catch(() => { setLoaded(true); });
  }, []);

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

      {/* Main Content (Scrolling Area) */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-10 pt-7 pb-10">

          {/* Hero Banner */}
          <section className="mb-10 relative overflow-hidden rounded-[2.5rem] bg-gradient-brand text-white px-14 py-8 shadow-xl">
            <div className="relative z-10 max-w-xl">
              <span className="text-white/70 font-bold tracking-widest text-[10px] uppercase mb-4 block">WELCOME TO NIDA3DVR</span>
              <h1 className="text-5xl font-extrabold mb-6 tracking-tight leading-none">Public Speaking Project</h1>
              <p className="text-white/80 text-xl mb-10 font-light leading-relaxed">
                Upload, manage, and experience your 180° VR videos and presentation practice sessions — all in one place.
              </p>
              <div className="flex gap-5">
                <Link href="/videos" className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg text-sm backdrop-blur-sm">
                  Get Started
                </Link>
              </div>
            </div>
            <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          </section>

          {/* Recommendations Section */}
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-red-600">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 .61-.03 1.3-.1 2.1-.06.8-.15 1.43-.28 1.9-.13.47-.35.83-.65 1.09-.3.26-.71.42-1.23.47-.52.05-1.34.07-2.47.07l-5.27.02-5.27-.02c-1.13 0-1.95-.02-2.47-.07-.52-.05-.93-.21-1.23-.47-.3-.26-.52-.62-.65-1.09-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-.61.03-1.3.1-2.1.06-.8.15-1.43.28-1.9.13-.47.35-.83.65-1.09.3-.26.71-.42 1.23-.47.52-.05 1.34-.07 2.47-.07l5.27-.02 5.27.02c1.13 0 1.95.02 2.47.07.52.05.93.21 1.23.47.3.26.52.62.65 1.09z" />
                </svg>
              </span>
              Recommended for you
            </h2>
            <Link href="/videos" className="text-brand-500 font-semibold text-sm hover:underline">
              View All →
            </Link>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12 mb-20">
            {!loaded ? (
              /* Skeleton while loading */
              [0, 1].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-100 rounded-3xl mb-4" />
                  <div className="flex gap-4 px-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : videos.length === 0 ? (
              /* Template cards — no videos yet */
              [
                { color: "from-brand-400 to-brand-700",     label: "Upload your first VR video",       sub: "Go to Videos to get started" },
                { color: "from-blue-400 to-indigo-600",    label: "Practice your presentation in VR",  sub: "Go to VR Speech Coach to begin" },
              ].map((tpl, i) => (
                <Link key={i} href={i === 0 ? "/videos" : "/vr-speech-coach"} className="group block">
                  <div className={`relative aspect-video bg-gradient-to-br ${tpl.color} rounded-3xl overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-all flex items-center justify-center`}>
                    <svg className="text-white opacity-30" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 text-white">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" strokeWidth="2"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 px-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-200">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-400 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">{tpl.label}</h3>
                      <p className="text-[11px] text-gray-300 mt-1.5">{tpl.sub}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              videos.map((video, idx) => {
                const initials = video.title.slice(0, 2).toUpperCase();
                const color = CARD_COLORS[idx % CARD_COLORS.length];

                return (
                  <div
                    key={video.id}
                    className="group cursor-pointer bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md rounded-3xl overflow-hidden transition-all duration-200"
                    onClick={() => openVideo(video)}
                  >
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                          <svg className="text-white opacity-20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 text-white">
                          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 bg-brand-700/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide backdrop-blur-sm">
                        180° VR
                      </div>
                      {video.duration > 0 && (
                        <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 px-4 py-3.5">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex-shrink-0 flex items-center justify-center text-brand-700 font-bold text-xs border border-brand-100">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-brand-700 transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1 flex-wrap">
                          <Clock size={10} strokeWidth={1.8} />
                          {fmtDate(video.uploadedAt)}
                          {video.views != null && video.views > 0 && <span>· {video.views.toLocaleString()} views</span>}
                          {video.description && (
                            <button
                              onClick={(e) => toggleDesc(video.id, e)}
                              className="ml-1 text-brand-500 hover:text-brand-700 font-medium cursor-pointer transition-colors"
                            >
                              {expandedDesc === video.id ? "...less" : "...more"}
                            </button>
                          )}
                        </p>
                        {expandedDesc === video.id && video.description && (
                          <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                            <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {video.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                );
              })
            )}
          </div>

        </div>
      </main>

      {playing && (
        <VideoPlayerModal
          video={playing}
          onClose={() => setPlaying(null)}
          onPlayVR={() => { setVrVideo(playing); setPlaying(null); }}
        />
      )}
    </MainLayout>
  );
}
