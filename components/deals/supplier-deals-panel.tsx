"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import type { Deal } from "@/lib/domain";
import type { DealMetadata } from "@/lib/domain/deal-workflow";

export function SupplierDealsPanel({
  supplierId,
  verificationStatus,
  pipelineStatus,
  deals,
  metadata,
}: {
  supplierId: string;
  verificationStatus: string;
  pipelineStatus: string;
  deals: Deal[];
  metadata: Record<string, DealMetadata>;
}) {
  const { user } = useAuth();
  const canCreate = can(user, "deal.create");
  const canReadCommercial = can(user, "commercial.read");
  const needsReview = verificationStatus !== "VERIFIED" || pipelineStatus !== "QUALIFIED";
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold text-slate-900">Associated deals</h2><p className="mt-1 text-xs text-slate-500">Commercial progression is separate from matching and qualification.</p></div>
        {canCreate && <Link href={`/deals/new?supplierId=${encodeURIComponent(supplierId)}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900"><Plus className="h-4 w-4" />Create Deal</Link>}
      </div>
      {needsReview && <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><strong>Supplier qualification is incomplete.</strong> Review verification before commercial progression. Confirmation is required when creating a deal.</div>}
      <div className="mt-4 divide-y divide-slate-100">
        {!deals.length ? <p className="py-3 text-sm text-slate-500">No deals linked to this supplier.</p> : deals.map((deal) => (
          <Link key={deal.id} href={`/deals/${deal.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-slate-50">
            <span><span className="block text-sm font-semibold text-slate-900">{deal.id}</span><span className="mt-1 block text-xs text-slate-500">{canReadCommercial ? `${deal.quantityMt === undefined ? "Quantity unknown" : `${deal.quantityMt} MT`} · ${deal.currency ?? "Currency unknown"} ${deal.pricePerMt ?? "Price unknown"} / MT` : "Commercial terms restricted"}</span></span>
            <span className="flex items-center gap-2">{metadata[deal.id]?.isDemoFixture && <StatusBadge label="SYNTHETIC FIXTURE" />}<StatusBadge label={deal.status} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
