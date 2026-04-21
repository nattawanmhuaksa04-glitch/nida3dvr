"use client";

import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import { X, Timer, Layers, Headset, Loader2 } from "lucide-react";
import type { AIScore } from "@/types";
import ScoreReport from "@/components/presentation/ScoreReport";

interface VRSceneProps {
  mode: "video" | "presentation";
  videoUrl?: string;
  slides?: string[];
  sessionId?: string;
  title?: string;
  heartRateRef?: RefObject<number>;
  onExit: () => void;
  onDone?: (result: { score?: AIScore; duration?: number }) => void;
}

function proxySlide(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export default function VRScene({ mode, videoUrl, slides = [], sessionId, title = "", heartRateRef, onExit, onDone }: VRSceneProps) {
  slides = slides.map(proxySlide);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sceneRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slideMeshRef = useRef<any>(null);
  const currentSlideRef = useRef(0);

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isVRMode, setIsVRMode] = useState(false);
  const [xrSupported, setXrSupported] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [videoReady, setVideoReady] = useState(!videoUrl); // true if no video
  const [scoreOverlay, setScoreOverlay] = useState<{ score: AIScore; duration: number } | null>(null);

  // Audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const isEndingRef = useRef(false);
  const endPresentationRef = useRef<() => void>(() => { });

  const updateSlide = useCallback((index: number) => {
    if (!slideMeshRef.current || !slides[index]) return;
    import("three").then(({ TextureLoader, MeshBasicMaterial, DoubleSide }) => {
      const mesh = slideMeshRef.current;
      if (!mesh) return;
      const loader = new TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(slides[index], (texture) => {
        if (!slideMeshRef.current) return;
        const oldMat = mesh.material as import("three").MeshBasicMaterial;
        oldMat.map?.dispose();
        oldMat.dispose();
        mesh.material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
      });
    });
  }, [slides]);

  const nextSlide = useCallback(() => {
    if (mode !== "presentation") return;
    if (currentSlideRef.current >= slides.length - 1) {
      endPresentationRef.current();
      return;
    }
    const next = currentSlideRef.current + 1;
    currentSlideRef.current = next;
    setCurrentSlideIdx(next);
  }, [mode, slides.length]);

  const prevSlide = useCallback(() => {
    if (mode !== "presentation") return;
    const prev = Math.max(currentSlideRef.current - 1, 0);
    currentSlideRef.current = prev;
    setCurrentSlideIdx(prev);
  }, [mode]);

  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch {
      console.warn("Mic unavailable");
    }
  }, []);

  const stopAndTranscribe = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") { resolve(""); return; }
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        recorder.stream.getTracks().forEach((t) => t.stop());
        try {
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const res = await fetch("/api/presentation/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          resolve(data.transcript || "");
        } catch { resolve(""); }
      };
      recorder.stop();
    });
  }, []);

  const endPresentation = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    // Exit VR session first so HTML overlay is visible
    try {
      await rendererRef.current?.xr.getSession()?.end();
    } catch { }

    setAnalyzing(true);
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const transcript = await stopAndTranscribe();

    // Call Gemini analyze
    let score: AIScore | undefined;
    try {
      const res = await fetch("/api/presentation/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          transcript,
          duration,
          slideCount: slides.length,
          slideChanges: [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        score = data.score;
      }
    } catch { }

    setAnalyzing(false);
    if (score) {
      setScoreOverlay({ score, duration });
    } else {
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
        rendererRef.current.dispose();
      }
      onDone?.({ score, duration });
    }
  }, [sessionId, slides.length, stopAndTranscribe, onDone]);

  // Keep ref in sync so nextSlide can call it without circular dependency
  endPresentationRef.current = endPresentation;

  useEffect(() => {
    // Timer for presentation
    if (mode !== "presentation") return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Update 3D slide texture whenever index changes
  useEffect(() => {
    if (currentSlideIdx === 0) return; // slide 0 already loaded in scene setup
    updateSlide(currentSlideIdx);
  }, [currentSlideIdx, updateSlide]);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let animationId: ReturnType<typeof setTimeout>;
    const container = containerRef.current;

    import("three").then(async (THREE) => {
      if (cancelled) return;
      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x101010);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 1.6, 3);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.xr.enabled = true;
      renderer.xr.setFramebufferScaleFactor(1.0);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Check XR support and expose via state
      if (navigator.xr) {
        navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
          if (!cancelled) setXrSupported(supported);
        });
      }

      renderer.xr.addEventListener("sessionstart", () => {
        setIsVRMode(true);
        camera.layers.enableAll();
      });
      renderer.xr.addEventListener("sessionend", () => setIsVRMode(false));

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(0, 5, 5);
      scene.add(dirLight);

      // 180° video background (Corrected for Canon VR180 SBS)
      if (videoUrl) {
        const video = document.createElement("video");
        video.src = videoUrl;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.crossOrigin = "anonymous";
        video.addEventListener("canplay", () => { if (!cancelled) setVideoReady(true); }, { once: true });
        video.load();
        video.play().catch(() => { });

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.generateMipmaps = false;
        videoTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        videoTexture.wrapS = THREE.ClampToEdgeWrapping;

        // Left eye — offset switches to 0.5 for right eye in onBeforeRender
        videoTexture.repeat.set(0.5, 1);
        videoTexture.offset.set(0, 0);

        // Hemisphere 180° — same approach as VideoPlayer180
        const geo = new THREE.SphereGeometry(500, 48, 32, Math.PI / 2, Math.PI);
        geo.scale(-1, 1, 1);

        const mat = new THREE.MeshBasicMaterial({
          map: videoTexture,
          depthWrite: false,
          depthTest: false
        });

        const sphere = new THREE.Mesh(geo, mat);
        sphere.renderOrder = -1;

        // VR headset looks at -Z (forward), so rotation = -PI/2
        sphere.rotation.y = -Math.PI / 2;

        // Resume video if browser pauses it when entering/exiting VR
        video.addEventListener("pause", () => { video.play().catch(() => {}); });
        document.addEventListener("visibilitychange", () => {
          if (renderer.xr.isPresenting) video.play().catch(() => {});
        });
        renderer.xr.addEventListener("sessionstart", () => { video.play().catch(() => {}); });

        sphere.onBeforeRender = (_r, _s, cam: import("three").Camera) => {
          const xrCam = cam as import("three").PerspectiveCamera & { viewport?: { x: number } };

          // 5. แก้ไขการสลับ Texture Offset สำหรับตาซ้ายและตาขวาในโหมด VR
          if (renderer.xr.isPresenting && xrCam.viewport && xrCam.viewport.x > 0) {
            // Right Eye: เลื่อนไปอ่านวิดีโอครึ่งหลัง (จากจุด 0.5 ถึง 1.0)
            videoTexture.offset.x = 0.5;
          } else {
            // Left Eye: อ่านวิดีโอครึ่งแรก (จากจุด 0.0 ถึง 0.5)
            videoTexture.offset.x = 0.0;
          }
        };

        scene.add(sphere);
      } else {
        // Default environment
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(20, 20),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
      }

      // Video mode: 3D Exit button (hidden until first controller press in VR)
      if (mode === "video") {
        const makeBtnCanvas = (label: string) => {
          const c = document.createElement("canvas");
          c.width = 384; c.height = 128;
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#1f2937";
          ctx.roundRect(0, 0, 384, 128, 32); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 56px Arial";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(label, 192, 64);
          return new THREE.CanvasTexture(c);
        };

        // Position: bottom-center (same area as Enter VR button on screen)
        const exitBtn = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.4),
          new THREE.MeshBasicMaterial({ map: makeBtnCanvas("Exit VR"), transparent: true })
        );
        exitBtn.position.set(0, 0.5, -2.5);
        exitBtn.visible = false; // hidden until first controller press
        scene.add(exitBtn);

        const ctrlRay = new THREE.Raycaster();
        const onCtrlPress = (ctrl: import("three").XRTargetRaySpace) => {
          const mx = new THREE.Matrix4();
          mx.identity().extractRotation(ctrl.matrixWorld);
          ctrlRay.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
          ctrlRay.ray.direction.set(0, 0, -1).applyMatrix4(mx);
          const hits = ctrlRay.intersectObjects([exitBtn]);

          if (!exitBtn.visible) {
            // Button hidden — show it
            exitBtn.visible = true;
          } else if (hits.length > 0) {
            // Button visible + pointing at it — exit
            renderer.xr.getSession()?.end().catch(() => { }).finally(() => onExit());
          } else {
            // Button visible + pointing elsewhere — hide it
            exitBtn.visible = false;
          }
        };

        const ctrl1 = renderer.xr.getController(0);
        ctrl1.addEventListener("selectstart", () => onCtrlPress(ctrl1));
        scene.add(ctrl1);
        const ctrl2 = renderer.xr.getController(1);
        ctrl2.addEventListener("selectstart", () => onCtrlPress(ctrl2));
        scene.add(ctrl2);

        const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
        const laserMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const l1 = new THREE.Line(laserGeo, laserMat); l1.scale.z = 5; ctrl1.add(l1);
        const l2 = new THREE.Line(laserGeo.clone(), laserMat); l2.scale.z = 5; ctrl2.add(l2);

        // Hide button when exiting VR
        renderer.xr.addEventListener("sessionend", () => { exitBtn.visible = false; });
      }

    // Presentation slide screen
    if (mode === "presentation" && slides.length > 0) {
      const distance = 5;
      const fov = 75;
      const visibleH = 2 * distance * Math.tan((fov * Math.PI / 180) / 2);
      const slideH = visibleH * 0.45;

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(slides[0], (texture) => {
        if (cancelled) return;
        // Use actual aspect ratio from image (same as original project)
        const img = texture.image as HTMLImageElement;
        const aspectRatio = img.width / img.height;
        const slideW = slideH * aspectRatio;

        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.generateMipmaps = true;

        const geo = new THREE.PlaneGeometry(slideW, slideH);
        const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 3.3, -distance);
        scene.add(mesh);
        slideMeshRef.current = mesh;

        // ‹ › buttons — sides of slide, vertically centered
        const btnGeo = new THREE.PlaneGeometry(0.7, 0.5);
        const makeLabel = (text: string) => {
          const c = document.createElement("canvas");
          c.width = 256; c.height = 128;
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.font = "bold 96px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, 128, 64);
          return new THREE.CanvasTexture(c);
        };

        const prevBtn = new THREE.Mesh(btnGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.85 }));
        prevBtn.position.set(-(slideW / 2 + 0.7), 3.3, -distance);
        prevBtn.userData = { action: prevSlide };
        scene.add(prevBtn);
        const prevLabel = new THREE.Mesh(btnGeo, new THREE.MeshBasicMaterial({ map: makeLabel("‹"), transparent: true }));
        prevLabel.position.set(prevBtn.position.x, 3.3, -distance + 0.01);
        scene.add(prevLabel);

        const nextBtn = new THREE.Mesh(btnGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.85 }));
        nextBtn.position.set(slideW / 2 + 0.7, 3.3, -distance);
        nextBtn.userData = { action: nextSlide };
        scene.add(nextBtn);
        const nextLabel = new THREE.Mesh(btnGeo, new THREE.MeshBasicMaterial({ map: makeLabel("›"), transparent: true }));
        nextLabel.position.set(nextBtn.position.x, 3.3, -distance + 0.01);
        scene.add(nextLabel);

        // End button (3D — visible in VR), top-center above slide
        const endBtnGeo = new THREE.PlaneGeometry(0.9, 0.35);
        const endBtnCanvas = document.createElement("canvas");
        endBtnCanvas.width = 384; endBtnCanvas.height = 128;
        const endCtx = endBtnCanvas.getContext("2d")!;
        endCtx.fillStyle = "#ef4444";
        endCtx.roundRect(0, 0, 384, 128, 32);
        endCtx.fill();
        endCtx.fillStyle = "#fff";
        endCtx.font = "bold 64px Arial";
        endCtx.textAlign = "center";
        endCtx.textBaseline = "middle";
        endCtx.fillText("End", 192, 64);
        const endBtnMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(endBtnCanvas), transparent: true });
        const endBtn = new THREE.Mesh(endBtnGeo, endBtnMat);
        // Offset End button left when HR is shown, keep centered otherwise
        endBtn.position.set(heartRateRef ? -0.5 : 0, 3.3 + slideH / 2 + 0.35, -distance);
        endBtn.userData = { action: endPresentation };
        scene.add(endBtn);

        // HR display next to End button
        if (heartRateRef) {
          const hrCanvas = document.createElement("canvas");
          hrCanvas.width = 320; hrCanvas.height = 128;
          const hrCtx = hrCanvas.getContext("2d")!;
          const hrTexture = new THREE.CanvasTexture(hrCanvas);
          const hrMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.35),
            new THREE.MeshBasicMaterial({ map: hrTexture, transparent: true, depthTest: false })
          );
          hrMesh.position.set(0.5, 3.3 + slideH / 2 + 0.35, -distance);
          hrMesh.renderOrder = 1;
          scene.add(hrMesh);

          let lastHr = -1;
          hrDisplay.fn = () => {
            const hr = heartRateRef.current ?? 0;
            if (hr === lastHr) return;
            lastHr = hr;
            hrCtx.clearRect(0, 0, 320, 128);
            const color = hr >= 130 ? "#ef4444" : hr >= 100 ? "#eab308" : "#22c55e";
            hrCtx.fillStyle = "rgba(0,0,0,0.70)";
            (hrCtx as CanvasRenderingContext2D & { roundRect: (x:number,y:number,w:number,h:number,r:number) => void })
              .roundRect(0, 0, 320, 128, 20);
            hrCtx.fill();
            hrCtx.textBaseline = "middle";
            hrCtx.textAlign = "left";
            // measure each part with its own font first
            const numStr = hr > 0 ? `${hr}` : "--";
            hrCtx.font = "bold 56px Arial";
            const heartW = hrCtx.measureText("♥").width;
            hrCtx.font = "bold 54px Arial";
            const numW = hrCtx.measureText(numStr).width;
            hrCtx.font = "20px Arial";
            const bpmW = hrCtx.measureText("bpm").width;
            // center the whole group
            const gap = 8;
            const totalW = heartW + gap + numW + gap + bpmW;
            const sx = (320 - totalW) / 2;
            hrCtx.fillStyle = color;
            hrCtx.font = "bold 56px Arial";
            hrCtx.fillText("♥", sx, 64);
            hrCtx.fillStyle = "#ffffff";
            hrCtx.font = "bold 54px Arial";
            hrCtx.fillText(numStr, sx + heartW + gap, 64);
            hrCtx.fillStyle = "#94a3b8";
            hrCtx.font = "20px Arial";
            hrCtx.fillText("bpm", sx + heartW + gap + numW + gap, 72);
            hrTexture.needsUpdate = true;
          };
          hrDisplay.fn();
        }

        // Mouse raycaster for desktop clicks — only on canvas
        const mouseRaycaster = new THREE.Raycaster();
        const onMouseClick = (e: MouseEvent) => {
          if (e.target !== renderer.domElement) return;
          const rect = renderer.domElement.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          mouseRaycaster.setFromCamera(new THREE.Vector2(x, y), camera);
          const hits = mouseRaycaster.intersectObjects([prevBtn, nextBtn, endBtn]);
          if (hits.length > 0 && hits[0].object.userData.action) {
            hits[0].object.userData.action();
          }
        };
        window.addEventListener("click", onMouseClick);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (renderer as any)._cleanupClick = () => window.removeEventListener("click", onMouseClick);

        // VR Controllers with raycaster
        const ctrlRaycaster = new THREE.Raycaster();
        const checkClick = (ctrl: import("three").XRTargetRaySpace) => {
          const mx = new THREE.Matrix4();
          mx.identity().extractRotation(ctrl.matrixWorld);
          ctrlRaycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
          ctrlRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(mx);
          const hits = ctrlRaycaster.intersectObjects([prevBtn, nextBtn, endBtn]);
          if (hits.length > 0 && hits[0].object.userData.action) {
            hits[0].object.userData.action();
          }
        };

        const ctrl1 = renderer.xr.getController(0);
        ctrl1.addEventListener("selectstart", () => checkClick(ctrl1));
        scene.add(ctrl1);
        const ctrl2 = renderer.xr.getController(1);
        ctrl2.addEventListener("selectstart", () => checkClick(ctrl2));
        scene.add(ctrl2);

        // Laser lines
        const laserGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -1),
        ]);
        const laserMat = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
        const laser1 = new THREE.Line(laserGeo, laserMat);
        laser1.scale.z = 5;
        ctrl1.add(laser1);
        const laser2 = new THREE.Line(laserGeo.clone(), laserMat);
        laser2.scale.z = 5;
        ctrl2.add(laser2);
      });

      // Gamepad polling (uses stable callback refs, no dependency on slideW/slideH)
      const gamepadState: Record<string, Record<string, unknown>> = {};
      const pollGamepad = () => {
        if (!renderer.xr.isPresenting) { requestAnimationFrame(pollGamepad); return; }
        const session = renderer.xr.getSession();
        if (!session) { requestAnimationFrame(pollGamepad); return; }
        session.inputSources.forEach((src, i) => {
          if (!src.gamepad) return;
          const key = `c${i}`;
          if (!gamepadState[key]) gamepadState[key] = {};
          const state = gamepadState[key];
          src.gamepad.buttons.forEach((btn, bi) => {
            const wasPressed = !!state[`b${bi}`];
            if (btn.pressed && !wasPressed) {
              if (bi === 4) prevSlide();
              else if (bi === 5) nextSlide();
              else if (bi === 0) nextSlide();
              else if (bi === 1) {
                if (!state.gripStart) state.gripStart = Date.now();
              }
            }
            if (bi === 1 && btn.pressed && state.gripStart) {
              if (Date.now() - (state.gripStart as number) > 1000) {
                endPresentation();
                state.gripStart = null;
              }
            }
            if (bi === 1 && !btn.pressed) state.gripStart = null;
            state[`b${bi}`] = btn.pressed;
          });
        });
        requestAnimationFrame(pollGamepad);
      };
      pollGamepad();
    }

    // Keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "b") nextSlide();
      else if (e.key === "ArrowLeft" || e.key === "a") prevSlide();
      else if (e.key === "Escape") { if (mode === "presentation") endPresentation(); else onExit(); }
    };
    window.addEventListener("keydown", onKey);

    // HR display — fn assigned inside loader callback
    const hrDisplay = { fn: null as (() => void) | null };

    // Animation loop
    renderer.setAnimationLoop(() => {
      hrDisplay.fn?.();
      renderer.render(scene, camera);
    });

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Start audio recording for presentation
    if (mode === "presentation") {
      startTimeRef.current = Date.now();
      startAudioRecording();
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (renderer as any)._cleanupClick?.();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  });

  return () => {
    cancelled = true;
    slideMeshRef.current = null;
    if (rendererRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rendererRef.current as any)._cleanupClick?.();
      rendererRef.current.setAnimationLoop(null);
      rendererRef.current.dispose();
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const enterVR = useCallback(async () => {
  if (!rendererRef.current || !navigator.xr) return;
  try {
    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor"],
    });
    await rendererRef.current.xr.setSession(session);
  } catch (e) {
    console.warn("Failed to enter VR:", e);
  }
}, []);

const timerDisplay = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;

return (
  <div className="fixed inset-0 z-50 bg-black">
    {/* Three.js canvas container */}
    <div ref={containerRef} className="w-full h-full" />

    {/* Top HUD overlay */}
    <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pointer-events-none">
      <div className="pointer-events-auto">
        <button
          onClick={() => (mode === "presentation" ? endPresentation() : onExit())}
          className="flex items-center bg-black/60 hover:bg-black/80 text-white font-medium p-2 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
        >
          <X size={15} />
        </button>
      </div>

      {mode === "presentation" && (
        <div className="flex items-center gap-3">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-white text-sm font-mono">
            <Timer size={14} className="text-[#3b82f6]" />
            {timerDisplay}
          </div>
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-white text-sm font-mono">
            <Layers size={14} className="text-[#3b82f6]" />
            {currentSlideIdx + 1} / {slides.length}
          </div>
        </div>
      )}

      {xrSupported && !isVRMode && (
        <button
          onClick={enterVR}
          className="pointer-events-auto flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-lg"
        >
          <Headset size={15} />
          Enter VR
        </button>
      )}

      {isVRMode && (
        <div className="bg-[#3b82f6]/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-white text-xs font-semibold">
          <Headset size={13} />
          VR MODE
        </div>
      )}
    </div>


    {/* Video buffering overlay */}
    {!videoReady && (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 size={40} className="animate-spin text-[#3b82f6]" />
        <p className="text-lg font-semibold">Loading video...</p>
        <p className="text-sm text-white/50">กำลังโหลดวิดีโอ</p>
      </div>
    )}

    {/* Analyzing overlay */}
    {analyzing && (
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 size={40} className="animate-spin text-[#3b82f6]" />
        <p className="text-xl font-semibold">Analyzing your presentation...</p>
        <p className="text-sm text-white/60">AI is reviewing your speech with Groq</p>
      </div>
    )}

    {/* Score overlay — shown inside VR before exiting */}
    {scoreOverlay && (
      <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <ScoreReport
            score={scoreOverlay.score}
            title={title}
            duration={scoreOverlay.duration}
            slideCount={slides.length}
          />
          <button
            onClick={() => {
              if (rendererRef.current) {
                rendererRef.current.setAnimationLoop(null);
                rendererRef.current.dispose();
              }
              onDone?.({ score: scoreOverlay.score, duration: scoreOverlay.duration });
            }}
            className="w-full mt-3 py-3 rounded-2xl font-bold text-sm transition-colors text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
          >
            Done
          </button>
        </div>
      </div>
    )}
  </div>
);
}
