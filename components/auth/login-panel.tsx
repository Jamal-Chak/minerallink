"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { USER_ROLES } from "@/lib/auth/user";

export function LoginPanel() {
  const { users, user, loading, startSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState("dev-admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authAvailable, setAuthAvailable] = useState(true);
  const activeUsers = users.filter((candidate) => candidate.status === "ACTIVE");
  const returnTo = searchParams.get("returnTo");
  const redirectPath = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  useEffect(() => {
    if (!loading && user) router.replace(redirectPath);
  }, [loading, redirectPath, router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await startSession(selectedUserId);
      router.replace(redirectPath);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start a development session.");
      setAuthAvailable(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-800 text-sm font-bold text-white">ML</div>
          <div><div className="text-xl font-semibold text-slate-900">MineralLink</div><p className="mt-1 text-xs text-slate-500">Mineral Supplier Intelligence &amp; Deal Management</p><p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Njapa Projects Pty Ltd</p></div>
        </div>
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800"><ShieldCheck className="h-4 w-4" />Development authentication</div>
          <h1 className="mt-2 text-lg font-semibold text-slate-900">Sign in to MineralLink</h1>
          <p className="mt-1 text-sm text-slate-600">Choose a synthetic development user to inspect role permissions. This is not production authentication.</p>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Development user
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="mt-1.5 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" disabled={loading || !authAvailable}>
              {activeUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.role.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          {error && <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
          {!authAvailable && <p className="text-xs text-slate-500">Development login is available only under `next dev`. Configure a production identity provider before deployment.</p>}
          <button type="submit" disabled={submitting || loading || !authAvailable || !activeUsers.length} className="flex h-10 w-full items-center justify-center rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Starting session…" : "Continue"}</button>
          <p className="text-[11px] leading-5 text-slate-500">No password is collected or stored. Development sessions use a short-lived HttpOnly cookie and a separate browser session key.</p>
        </form>
        <div className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500">Available roles: {USER_ROLES.map((role) => role.replaceAll("_", " ")).join(" · ")}</div>
      </section>
    </main>
  );
}
