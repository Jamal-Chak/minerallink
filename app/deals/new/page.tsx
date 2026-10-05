import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DealCreateForm } from "@/components/deals/deal-create-form";
import { PermissionGate } from "@/components/auth/permission-gate";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ supplierId?: string; productId?: string; requirementId?: string; fromMatch?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/deals" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to deals</Link>
      <div><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Commercial pipeline</div><h1 className="mt-2 text-2xl font-semibold text-slate-900">Create deal</h1><p className="mt-1 text-sm text-slate-600">Create an explicit commercial workspace. No offer, introduction, or transaction is implied by this record.</p></div>
      <PermissionGate permission="deal.create"><DealCreateForm initialSupplierId={params.supplierId} initialProductId={params.productId} initialRequirementId={params.requirementId} createdFromMatch={params.fromMatch === "1"} /></PermissionGate>
    </div>
  );
}
