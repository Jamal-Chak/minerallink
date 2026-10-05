import { LockKeyhole } from "lucide-react";

import { permissionMessage, type Permission } from "@/lib/auth/permissions";

export function AccessDenied({ permission }: { permission: Permission }) {
  return (
    <section className="mx-auto max-w-xl rounded-xl border border-amber-300 bg-white p-6">
      <div className="flex items-center gap-2 text-amber-900"><LockKeyhole className="h-5 w-5" /><h1 className="text-lg font-semibold">Access restricted</h1></div>
      <p className="mt-3 text-sm text-slate-700">{permissionMessage(permission)}</p>
      <p className="mt-2 text-xs text-slate-500">Your current development role does not grant this route permission.</p>
    </section>
  );
}
