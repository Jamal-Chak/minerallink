"use client";

import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { updateSupplierDocumentStatus } from "@/lib/data/supplier-workspace";
import type { SupplierDocumentRecord } from "@/lib/domain/supplier-workflow";

const statuses = ["UNVERIFIED", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const;

export function SupplierDocumentRegister({ supplierId, documents }: { supplierId: string; documents: SupplierDocumentRecord[] }) {
  const { user } = useAuth();
  const editable = can(user, "supplier.evidence.manage");
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        Browser development metadata only. MineralLink has not received or stored document files through this interface.
      </div>
      {!documents.length ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No document metadata recorded.</p> : documents.map((document) => (
        <article key={document.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-slate-900">{document.name}</h3>
              <StatusBadge label={document.type} />
              <StatusBadge label={document.status} />
            </div>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              <div><dt className="inline font-medium">Reference: </dt><dd className="inline">{document.reference ?? "None"}</dd></div>
              <div><dt className="inline font-medium">Issued: </dt><dd className="inline">{document.issuedAt ?? "Not provided"}</dd></div>
              <div><dt className="inline font-medium">Expires: </dt><dd className="inline">{document.expiresAt ?? "Not applicable / not provided"}</dd></div>
              <div><dt className="inline font-medium">Storage: </dt><dd className="inline">Metadata only</dd></div>
            </dl>
            {document.notes && <p className="mt-2 text-xs text-slate-600">{document.notes}</p>}
          </div>
          <label className="text-xs font-medium text-slate-600">
            Document status
            <select value={document.status} disabled={!editable} onChange={(event) => updateSupplierDocumentStatus(supplierId, document.id, event.target.value as SupplierDocumentRecord["status"])} className="mt-1 block h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 disabled:bg-slate-100">
              {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
            </select>
          </label>
        </article>
      ))}
    </div>
  );
}
