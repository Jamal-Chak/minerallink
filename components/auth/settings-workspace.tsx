"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { can } from "@/lib/auth/permissions";
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from "@/lib/auth/user";

const tabs = ["Profile", "Users & Access", "Security", "Development Session"] as const;
type SettingsTab = (typeof tabs)[number];

export function SettingsWorkspace() {
  const { user, users, updateUser, switchUser } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("Profile");
  const [error, setError] = useState("");
  const canManageUsers = can(user, "user.manage");

  function update(userId: string, changes: { role?: UserRole; status?: UserStatus }) {
    try {
      setError("");
      updateUser(userId, changes);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update development user.");
    }
  }

  return (
    <div className="space-y-5">
      <div><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace settings</div><h1 className="mt-2 text-2xl font-semibold text-slate-900">Settings</h1></div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label="Settings sections">
        {tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === item ? "border-emerald-800 text-emerald-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>{item}</button>)}
      </div>

      {tab === "Profile" && <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Profile</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wide text-slate-500">Name</dt><dd className="mt-1 text-sm font-medium text-slate-900">{user?.name ?? "No active session"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt><dd className="mt-1 text-sm font-medium text-slate-900">{user?.email ?? "—"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-slate-500">Role</dt><dd className="mt-1"><StatusBadge label={user?.role ?? "UNAUTHENTICATED"} /></dd></div><div><dt className="text-xs uppercase tracking-wide text-slate-500">Account status</dt><dd className="mt-1"><StatusBadge label={user?.status ?? "UNKNOWN"} /></dd></div></dl></section>}

      {tab === "Users & Access" && <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Users &amp; Access</h2><p className="mt-1 text-sm text-slate-600">Development-only identities. INVITED users are examples; no invitation email is sent.</p></div><StatusBadge label={canManageUsers ? "USER MANAGEMENT ENABLED" : "READ ONLY"} /></div>{error && <p role="alert" className="mt-3 rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}<div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">User</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((account) => <tr key={account.id}><td className="px-3 py-3"><div className="font-medium text-slate-900">{account.name}</div><div className="text-xs text-slate-500">{account.email} · synthetic development user</div></td><td className="px-3 py-3"><select aria-label={`${account.name} role`} disabled={!canManageUsers} value={account.role} onChange={(event) => update(account.id, { role: event.target.value as UserRole })} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs disabled:bg-slate-100 disabled:text-slate-500">{USER_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></td><td className="px-3 py-3"><select aria-label={`${account.name} status`} disabled={!canManageUsers} value={account.status} onChange={(event) => update(account.id, { status: event.target.value as UserStatus })} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs disabled:bg-slate-100 disabled:text-slate-500">{USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div>{!canManageUsers && <p className="mt-3 text-xs text-slate-500">Your role can inspect the development directory but cannot change user roles or statuses.</p>}</section>}

      {tab === "Security" && <section className="max-w-3xl rounded-xl border border-amber-300 bg-amber-50 p-5"><h2 className="font-semibold text-amber-950">Development security boundary</h2><p className="mt-2 text-sm leading-6 text-amber-950">Development authentication uses synthetic accounts, browser session state, and an HttpOnly development cookie. It is not production identity, does not provide production-grade authorization, and must be replaced before deployment.</p><ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-950"><li>No password or credential is collected or stored.</li><li>Operational mutations check permissions in the browser service boundary.</li><li>Production authentication and server-side data authorization are not configured.</li></ul></section>}

      {tab === "Development Session" && <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Development Session</h2><p className="mt-1 text-sm text-slate-600">Switch synthetic roles to inspect their access. Role changes apply to this browser session only.</p><label className="mt-4 block text-sm font-medium text-slate-700">Current development user<select aria-label="Current development user" value={user?.id ?? ""} onChange={(event) => void switchUser(event.target.value)} className="mt-1.5 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{users.filter((account) => account.status === "ACTIVE").map((account) => <option key={account.id} value={account.id}>{account.name} · {account.role.replaceAll("_", " ")}</option>)}</select></label><div className="mt-3 inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900">Development authentication</div></section>}
    </div>
  );
}
