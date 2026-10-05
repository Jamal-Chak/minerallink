import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SupplierForm } from "@/components/supplier-workflow/supplier-form";
import { PermissionGate } from "@/components/auth/permission-gate";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to suppliers
      </Link>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Supplier onboarding</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Add supplier</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">Capture the company, contact, supply location, and sourcing context. Verification and qualification are handled separately after creation.</p>
      </div>
      <PermissionGate permission="supplier.create"><SupplierForm /></PermissionGate>
    </div>
  );
}
