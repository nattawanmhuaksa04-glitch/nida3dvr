import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "NIDA3DVR",
  description: "VR Video Platform & Presentation Training",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
