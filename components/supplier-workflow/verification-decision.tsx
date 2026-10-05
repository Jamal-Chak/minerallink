"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/supplier-workflow/form-controls";
import { updateSupplierVerification } from "@/lib/data/supplier-workspace";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { VERIFICATION_STATUSES, type VerificationStatus } from "@/lib/domain";

export function VerificationDecision({ supplierId, currentStatus }: { supplierId: string; currentStatus: VerificationStatus }) {
  const { user } = useAuth();
  const allowed = can(user, "supplier.verify");
  const [status, setStatus] = useState<VerificationStatus>(currentStatus);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function saveDecision() {
    const requiresReason = status === "VERIFIED" || status === "REJECTED";
    if (requiresReason && reason.trim().length < 5) {
      setError("Add an internal reason of at least 5 characters for this decision.");
      return;
    }
    if (status === "VERIFIED" && !window.confirm("Verification means MineralLink has reviewed the supplier evidence. This does not follow automatically from checklist completion. Record this explicit decision?")) {
      return;
    }
    updateSupplierVerification(supplierId, status, reason.trim() || "Status updated by internal user.");
    setError("");
    setReason("");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">Verification decision</h3>
      <p className="mt-1 text-xs text-slate-500">An explicit internal decision, separate from pipeline stage and checklist completion.</p>
      {!allowed ? <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">Verification decisions are restricted to authorized verification roles.</div> : <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
        <label className="block text-xs font-medium text-slate-600">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as VerificationStatus)} className="mt-1 block h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900">
            {VERIFICATION_STATUSES.map((choice) => <option key={choice} value={choice}>{choice.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Internal reason {status === "VERIFIED" || status === "REJECTED" ? "(required)" : "(optional)"}
          <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 block h-9 w-full rounded-md border border-slate-300 px-2 text-sm text-slate-900" placeholder="Evidence review rationale" />
        </label>
        <Button type="button" onClick={saveDecision}>Record decision</Button>
      </div>}
      <FieldError message={error} />
    </section>
  );
}
