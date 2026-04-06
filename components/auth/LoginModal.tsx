"use client";

import { useState } from "react";
import { X, LogIn, LogOut, User, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { isLoggedIn, login, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const ok = login(username.trim(), password);
      if (ok) {
        onClose();
      } else {
        setError("Username or password incorrect");
      }
      setLoading(false);
    }, 300);
  }

  function handleLogout() {
    logout();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-brand flex items-center justify-center shrink-0">
              <User size={16} className="text-white" strokeWidth={2} />
            </div>
            <h2 className="font-bold text-slate-900">
              {isLoggedIn ? "Account" : "Admin Login"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {isLoggedIn ? (
            /* Logged-in state */
            <div className="space-y-5">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Logged in as Admin</p>
                  <p className="text-xs text-slate-400 mt-0.5">Upload access enabled</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          ) : (
            /* Login form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><User size={13} /> Username</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="input w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Lock size={13} /> Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input w-full"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!username || !password || loading}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LogIn size={15} />
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
