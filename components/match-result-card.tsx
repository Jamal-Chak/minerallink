"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { MineralMatchResult } from "@/lib/matching";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";

interface MatchResultCardProps {
  supplierName: string;
  result: MineralMatchResult;
  createDealHref?: string;
}

export function MatchResultCard({ supplierName, result, createDealHref }: MatchResultCardProps) {
  const { user } = useAuth();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Supplier</div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{supplierName}</h3>
        </div>
        <StatusBadge label={result.status} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Passed</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{result.passed}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Failed</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{result.failed}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Missing</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{result.missing}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {result.checks.map((check) => (
          <div key={check.field} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <div className="text-sm font-medium text-slate-900">{check.label}</div>
              <div className="mt-1 text-xs text-slate-500">
                {String(check.actual ?? "Not provided")} · {check.operator}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Required</div>
              <div className="text-sm font-medium text-slate-700">{String(check.required)}</div>
            </div>
            <StatusBadge label={check.status} />
          </div>
        ))}
      </div>
      {result.status === "MATCH" && createDealHref && can(user, "deal.create") && <div className="mt-4 flex justify-end border-t border-slate-200 pt-3"><Link href={createDealHref} className="inline-flex h-9 items-center rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900">Create Deal</Link></div>}
    </div>
  );
}
