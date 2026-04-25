"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // ChunkLoadError = stale deploy — hard reload to get fresh chunks
    if (error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk")) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-4">
      <p className="text-white/60 text-sm">เกิดข้อผิดพลาด กรุณาลองใหม่</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
      >
        ลองใหม่
      </button>
    </div>
  );
}
