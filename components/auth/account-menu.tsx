"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function AccountMenu() {
  const { user, users, switchUser, endSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  if (!user) return null;

  async function changeUser(userId: string) {
    try {
      setError("");
      await switchUser(userId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not switch development user.");
    }
  }

  async function logout() {
    await endSession();
    router.replace("/login");
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="hidden text-right sm:block"><div className="text-xs font-semibold text-slate-800">{user.name}</div><div className="text-[10px] uppercase tracking-wide text-slate-500">{user.role.replaceAll("_", " ")}</div></div>
      <label className="sr-only" htmlFor="dev-role-switch">Development role switch</label>
      <select id="dev-role-switch" aria-label="Development role switch" value={user.id} onChange={(event) => void changeUser(event.target.value)} className="h-8 max-w-40 rounded-md border border-amber-300 bg-amber-50 px-2 text-[10px] text-amber-950">
        {users.filter((candidate) => candidate.status === "ACTIVE").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.role.replaceAll("_", " ")}</option>)}
      </select>
      <Button type="button" variant="outline" size="sm" onClick={() => void logout()} title="Log out"><LogOut className="h-4 w-4" /><span className="hidden md:inline">Logout</span></Button>
      {error && <span role="alert" className="text-xs text-rose-700">{error}</span>}
      <span className="sr-only"><UserRound /></span>
    </div>
  );
}
