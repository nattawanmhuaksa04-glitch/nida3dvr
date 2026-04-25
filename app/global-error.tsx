"use client";

import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk")) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="th">
      <body style={{ background: "#030712", color: "white", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>กำลังโหลดใหม่...</p>
        </div>
      </body>
    </html>
  );
}
