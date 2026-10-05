"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { SUPPLIER_PIPELINE_STATUSES, type SupplierPipelineStatus } from "@/lib/domain";
import { updateSupplierPipeline } from "@/lib/data/supplier-workspace";

export function PipelineSelector({ supplierId, currentStatus }: { supplierId: string; currentStatus: SupplierPipelineStatus }) {
  const { user } = useAuth();
  const editable = can(user, "supplier.pipeline.manage");
  return (
    <label className="block text-xs font-medium text-slate-600">
      Pipeline stage
      <select
        value={currentStatus}
        disabled={!editable}
        onChange={(event) => updateSupplierPipeline(supplierId, event.target.value as SupplierPipelineStatus)}
        className="mt-1 block h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
      >
        {SUPPLIER_PIPELINE_STATUSES.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}
      </select>
      {!editable && <span className="mt-1 block text-[10px] text-slate-500">Read-only for your role.</span>}
    </label>
  );
}
