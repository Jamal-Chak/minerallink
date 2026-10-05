"use client";

import { useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { updateVerificationCheck } from "@/lib/data/supplier-workspace";
import type { SupplierVerificationCheck, VerificationCheckStatus } from "@/lib/domain/supplier-workflow";

const statuses: VerificationCheckStatus[] = ["VERIFIED", "PENDING", "MISSING", "REJECTED"];

function CheckRow({ supplierId, check, editable }: { supplierId: string; check: SupplierVerificationCheck; editable: boolean }) {
  const [note, setNote] = useState(check.note ?? "");
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_150px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{check.label}</span>
          <StatusBadge label={check.status} />
        </div>
        <input
          value={note}
          disabled={!editable}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => updateVerificationCheck(supplierId, check.id, check.status, note)}
          placeholder="Internal evidence note"
          aria-label={`${check.label} internal evidence note`}
          className="mt-2 w-full border-0 border-b border-slate-200 bg-transparent px-0 py-1 text-xs text-slate-600 outline-none focus:border-emerald-700"
        />
      </div>
      <select
        value={check.status}
        disabled={!editable}
        onChange={(event) => updateVerificationCheck(supplierId, check.id, event.target.value as VerificationCheckStatus, note)}
        aria-label={`${check.label} status`}
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
      >
        {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
      </select>
    </div>
  );
}

export function VerificationChecklist({ supplierId, checks }: { supplierId: string; checks: SupplierVerificationCheck[] }) {
  const { user } = useAuth();
  const editable = can(user, "supplier.evidence.manage");
  const completed = checks.filter((check) => check.status === "VERIFIED").length;
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-900">Qualification checks</h3>
        <span className="text-sm font-semibold text-slate-700">{completed} / {checks.length} checks completed</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">Checklist progress is evidence tracking only. It never changes the supplier verification decision.</p>
      {!editable && <p className="mb-3 text-xs text-amber-800">Read-only for your role. Verification analysts manage checklist evidence.</p>}
      <div className="space-y-2">
        {checks.map((check) => <CheckRow key={check.id} supplierId={supplierId} check={check} editable={editable} />)}
      </div>
    </section>
  );
}
