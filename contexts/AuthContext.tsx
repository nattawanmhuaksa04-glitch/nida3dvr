"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS ?? "nida2025";
const LS_KEY = "nida3dvr_auth";

type AuthContextType = {
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(LS_KEY) === "1");
  }, []);

  function login(username: string, password: string): boolean {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      localStorage.setItem(LS_KEY, "1");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(LS_KEY);
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
