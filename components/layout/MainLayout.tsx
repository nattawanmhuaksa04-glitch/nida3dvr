"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Video, Presentation, Headset } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home",           href: "/",              icon: Home },
  { label: "Videos",         href: "/videos",        icon: Video },
  { label: "Presentations",  href: "/presentations", icon: Presentation },
  { label: "VR Speech Coach", href: "/vr-speech-coach", icon: Headset },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden md:flex w-72 h-full bg-white border-r border-gray-100 flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-6 pt-7 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shrink-0">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="text-[22px] font-bold text-slate-900 tracking-tight">NIDA3DVR</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-6">
          <p className="px-4 mb-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">MENU</p>
          <div className="flex flex-col gap-2">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-4 mx-1 px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-colors ${
                    isActive ? "bg-brand-50 text-brand-700 font-semibold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-2xl px-2 py-1.5 -mx-2 transition-colors cursor-pointer group"
          >
            <div className="relative w-9 h-9 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              N
              {isLoggedIn && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-slate-900">NIDA3DVR</span>
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition-colors relative cursor-pointer">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </aside>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
          <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span className="text-[18px] font-bold text-slate-900 tracking-tight">NIDA3DVR</span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-16 md:pb-0">
          {children}
        </div>

        {/* ── Bottom Navigation (mobile only) ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={label}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? "text-brand-600" : "text-gray-400"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="leading-none">{label === "VR Speech Coach" ? "VR Coach" : label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
