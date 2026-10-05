"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { readDevelopmentSessionUser, readDevelopmentUsers, storeDevelopmentSession, clearDevelopmentSession, updateDevelopmentUser } from "@/lib/auth/client-store";
import type { ApplicationUser, UserRole, UserStatus } from "@/lib/auth/user";

interface AuthContextValue {
  user: ApplicationUser | null;
  users: ApplicationUser[];
  loading: boolean;
  development: true;
  startSession: (userId: string) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  endSession: () => Promise<void>;
  updateUser: (userId: string, updates: { role?: UserRole; status?: UserStatus }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApplicationUser | null>(null);
  const [users, setUsers] = useState<ApplicationUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshDirectory = useCallback(() => {
    const nextUsers = readDevelopmentUsers();
    setUsers(nextUsers);
    const sessionUser = readDevelopmentSessionUser();
    setUser(sessionUser);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ userId: string }> : null)
      .then((session) => {
        if (!mounted) return;
        if (session?.userId) storeDevelopmentSession(session.userId);
        else clearDevelopmentSession();
        refreshDirectory();
      })
      .catch(() => {
        if (mounted) {
          clearDevelopmentSession();
          refreshDirectory();
        }
      })
      .finally(() => { if (mounted) setLoading(false); });
    window.addEventListener("minerallink:dev-users-change", refreshDirectory);
    return () => {
      mounted = false;
      window.removeEventListener("minerallink:dev-users-change", refreshDirectory);
    };
  }, [refreshDirectory]);

  const startSession = useCallback(async (userId: string) => {
    const selected = readDevelopmentUsers().find((item) => item.id === userId);
    if (!selected || selected.status !== "ACTIVE") throw new Error("Select an active development user.");
    const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Development authentication is unavailable." }));
      throw new Error(result.error ?? "Development authentication is unavailable.");
    }
    storeDevelopmentSession(userId);
    refreshDirectory();
  }, [refreshDirectory]);

  const endSession = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    clearDevelopmentSession();
    setUser(null);
  }, []);

  const switchUser = useCallback(async (userId: string) => startSession(userId), [startSession]);

  const updateUser = useCallback((userId: string, updates: { role?: UserRole; status?: UserStatus }) => {
    updateDevelopmentUser(user, userId, updates);
    if (user?.id === userId && updates.status && updates.status !== "ACTIVE") {
      void fetch("/api/auth/session", { method: "DELETE" });
      clearDevelopmentSession();
      setUser(null);
    }
    refreshDirectory();
  }, [refreshDirectory, user]);

  const value = useMemo<AuthContextValue>(() => ({ user, users, loading, development: true, startSession, switchUser, endSession, updateUser }), [endSession, loading, startSession, switchUser, updateUser, user, users]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
