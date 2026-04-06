"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Play, Pause, Volume2, VolumeX, Move, Maximize, Minimize } from "lucide-react";

export default function VideoPlayer180({ src }: { src: string }) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const videoElRef    = useRef<HTMLVideoElement | null>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);

  const [paused,     setPaused]     = useState(false);
  const [muted,      setMuted]      = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [ready,      setReady]      = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  /* ── controls ── */
  const togglePlay = useCallback(() => {
    const v = videoElRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoElRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoElRef.current;
    if (!v || !v.duration) return;
    v.currentTime = (parseFloat(e.target.value) / 100) * v.duration;
  }, []);

  const toggleFullscreen = useCallback(() => setFullscreen(f => !f), []);

  /* ── Esc key exits fullscreen ── */
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); setFullscreen(false); }
    };
    window.addEventListener("keydown", onKey, true); // capture phase → runs before modal's handler
    return () => window.removeEventListener("keydown", onKey, true);
  }, [fullscreen]);

  /* ── Three.js setup ── */
  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const video = document.createElement("video");
    video.src         = src;
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.muted       = false;
    videoElRef.current = video;

    video.addEventListener("timeupdate", () =>
      setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0));
    video.addEventListener("loadedmetadata", () => {
      setDuration(video.duration);
      setReady(true);
      video.play().catch(() => {});
    });
    video.addEventListener("play",  () => setPaused(false));
    video.addEventListener("pause", () => setPaused(true));
    video.load();

    const w = wrap.clientWidth  || 640;
    const h = wrap.clientHeight || Math.round((w * 9) / 16);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // updateStyle=false → Three.js won't overwrite canvas CSS width/height
    renderer.setSize(w, h, false);

    // Canvas fills its wrapper via CSS — wrapper controls the visible size
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width   = "100%";
    canvas.style.height  = "100%";

    wrap.appendChild(canvas);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(80, w / h, 0.1, 1000);
    camera.position.set(0, 0, 0.01);
    cameraRef.current = camera;

    const scene = new THREE.Scene();

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS      = THREE.ClampToEdgeWrapping;
    texture.wrapT      = THREE.ClampToEdgeWrapping;
    texture.repeat.set(-0.5, 1);
    texture.offset.set(0.5, 0);

    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere   = new THREE.Mesh(geometry, material);
    sphere.rotation.y = Math.PI;
    scene.add(sphere);

    let dragging = false, prevX = 0, prevY = 0, lon = 0, lat = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true; prevX = e.clientX; prevY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      lon -= (e.clientX - prevX) * 0.25;
      lat += (e.clientY - prevY) * 0.25;
      lat = Math.max(-85, Math.min(85, lat));
      lon = Math.max(-90, Math.min(90, lon));
      prevX = e.clientX; prevY = e.clientY;
    };
    const onUp = () => { dragging = false; canvas.style.cursor = "grab"; };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown",  onDown);
    canvas.addEventListener("pointermove",  onMove);
    canvas.addEventListener("pointerup",    onUp);
    canvas.addEventListener("pointerleave", onUp);

    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const phi   = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );
      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver watches the wrapper — updates WebGL resolution only (CSS stays 100%/100%)
    const ro = new ResizeObserver(([entry]) => {
      const { inlineSize: nw, blockSize: nh } = entry.contentBoxSize[0];
      if (!nw || !nh) return;
      renderer.setSize(nw, nh, false);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown",  onDown);
      canvas.removeEventListener("pointermove",  onMove);
      canvas.removeEventListener("pointerup",    onUp);
      canvas.removeEventListener("pointerleave", onUp);
      video.pause(); video.src = "";
      texture.dispose(); geometry.dispose(); material.dispose(); renderer.dispose();
      if (wrap.contains(canvas)) wrap.removeChild(canvas);
      rendererRef.current = null;
      cameraRef.current   = null;
      videoElRef.current  = null;
    };
  }, [src]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const currentTime = duration ? (progress / 100) * duration : 0;

  return (
    <div
      className="bg-black select-none flex flex-col"
      style={fullscreen ? { position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999 } : {}}
    >
      {/* Canvas wrapper: aspect-video in normal mode, flex-1 in fullscreen */}
      <div
        ref={canvasWrapRef}
        className="relative w-full overflow-hidden"
        style={fullscreen ? { flex: 1, minHeight: 0 } : { aspectRatio: "16 / 9" }}
      >
        {ready && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 pointer-events-none backdrop-blur-sm z-10">
            <Move size={11} /> Drag to look around
          </div>
        )}
      </div>

      <Controls
        paused={paused} muted={muted} progress={progress}
        currentTime={currentTime} duration={duration} fullscreen={fullscreen}
        onPlay={togglePlay} onMute={toggleMute} onSeek={seek}
        onFullscreen={toggleFullscreen} fmt={fmt}
      />
    </div>
  );
}

function Controls({ paused, muted, progress, currentTime, duration, fullscreen, onPlay, onMute, onSeek, onFullscreen, fmt }: {
  paused: boolean; muted: boolean; progress: number; currentTime: number;
  duration: number; fullscreen: boolean;
  onPlay: () => void; onMute: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFullscreen: () => void; fmt: (s: number) => string;
}) {
  return (
    <div className="bg-black px-4 py-2.5 flex items-center gap-3 shrink-0">
      <button onClick={onPlay} className="text-white hover:text-brand-400 transition-colors cursor-pointer shrink-0">
        {paused
          ? <Play  size={16} fill="currentColor" strokeWidth={0} />
          : <Pause size={16} fill="currentColor" strokeWidth={0} />}
      </button>
      <input type="range" min="0" max="100" step="0.1" value={progress} onChange={onSeek}
        className="flex-1 h-1 accent-brand-500 cursor-pointer" />
      <span className="text-white/50 text-[11px] font-mono tabular-nums shrink-0">
        {fmt(currentTime)} / {fmt(duration)}
      </span>
      <button onClick={onMute} className="text-white hover:text-brand-400 transition-colors cursor-pointer shrink-0">
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <button onClick={onFullscreen} className="text-white hover:text-brand-400 transition-colors cursor-pointer shrink-0">
        {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
    </div>
  );
}
