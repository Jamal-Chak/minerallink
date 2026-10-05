"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { useSupplierWorkspace } from "@/lib/data/use-supplier-workspace";
import { can } from "@/lib/auth/permissions";
import { DEAL_STATUSES } from "@/lib/domain/deal";
import { calculateDealValue, calculateEstimatedCommission, sumCurrencyValues } from "@/lib/utils/commercial-math";

const selectClass = "h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800";
const isClosed = (status: string) => status === "COMPLETED" || status === "CANCELLED";

export function DealsDashboard() {
  const { user } = useAuth();
  const canCreateDeal = can(user, "deal.create");
  const canReadCommercial = can(user, "commercial.read");
  const canReadCommission = can(user, "commission.read");
  const { workspace } = useSupplierWorkspace();
  const [commodity, setCommodity] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [stage, setStage] = useState("");
  const [supplyType, setSupplyType] = useState("");
  const [destination, setDestination] = useState("");
  const buyerIds = [...new Set(workspace.deals.map((deal) => deal.buyerId))];
  const destinations = [...new Set(workspace.deals.map((deal) => workspace.dealMetadata[deal.id]?.destination).filter((value): value is string => Boolean(value)))];

  const records = useMemo(() => workspace.deals.filter((deal) => {
    const product = workspace.products[deal.supplierId]?.find((item) => item.id === deal.productId);
    return (!commodity || product?.specification.commodity === commodity)
      && (!supplierFilter || deal.supplierId === supplierFilter)
      && (!buyerFilter || deal.buyerId === buyerFilter)
      && (!stage || deal.status === stage)
      && (!supplyType || workspace.dealMetadata[deal.id]?.supplyType === supplyType)
      && (!destination || workspace.dealMetadata[deal.id]?.destination === destination);
  }), [buyerFilter, commodity, destination, stage, supplierFilter, supplyType, workspace.dealMetadata, workspace.deals, workspace.products]);

  const openDeals = workspace.deals.filter((deal) => !isClosed(deal.status));
  const potentialValue = sumCurrencyValues(openDeals.map((deal) => calculateDealValue(workspace.commercialTerms[deal.id]?.quantityMt, workspace.commercialTerms[deal.id]?.pricePerMt, workspace.commercialTerms[deal.id]?.currency)));
  const potentialCommission = sumCurrencyValues(openDeals.map((deal) => {
    const terms = workspace.commercialTerms[deal.id];
    const commission = workspace.commissions[deal.id];
    if (!terms || !commission || ["EARNED", "INVOICED", "PAID"].includes(commission.status)) return undefined;
    return calculateEstimatedCommission({ quantityMt: terms.quantityMt, pricePerMt: terms.pricePerMt, percentage: commission.type === "PERCENTAGE" ? commission.percentage : undefined, fixedAmount: commission.type === "FIXED" ? commission.fixedAmount : undefined, currency: commission.currency ?? terms.currency });
  }));
  const metrics = [
    ["Active deals", openDeals.length],
    ["In negotiation", workspace.deals.filter((deal) => deal.status === "NEGOTIATION").length],
    ["Trial shipments", workspace.deals.filter((deal) => deal.status === "TRIAL_SHIPMENT").length],
    ["Active contracts", workspace.deals.filter((deal) => deal.status === "ACTIVE_CONTRACT").length],
    ["Completed", workspace.deals.filter((deal) => deal.status === "COMPLETED").length],
  ] as const;
  const tableHeaders = ["Deal", "Buyer", "Supplier", "Mineral", ...(canReadCommercial ? ["Quantity", "Price / MT", "Potential value"] : []), "Stage", "Supply", ...(canReadCommission ? ["Commission"] : [])];
  const currencies = (values: string[]) => values.length ? values.join(" · ") : "Unknown";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div></div>)}
      </div>
      {(canReadCommercial || canReadCommission) && <div className="grid gap-3 sm:grid-cols-2">
        {canReadCommercial && <div className="rounded-xl border border-sky-200 bg-sky-50 p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-sky-800">Potential deal value · indicative / active only</div><div className="mt-2 text-lg font-semibold text-slate-900">{currencies(potentialValue)}</div></div>}
        {canReadCommission && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-amber-900">Potential estimated commission · not revenue</div><div className="mt-2 text-lg font-semibold text-slate-900">{currencies(potentialCommission)}</div></div>}
      </div>
      }
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-6">
        <label className="text-xs font-medium text-slate-600">Commodity<select value={commodity} onChange={(event) => setCommodity(event.target.value)} className={`${selectClass} mt-1`}><option value="">All commodities</option>{["COPPER", "LEAD", "ZINC", "NICKEL"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Supplier<select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className={`${selectClass} mt-1`}><option value="">All suppliers</option>{workspace.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.companyName}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Buyer<select value={buyerFilter} onChange={(event) => setBuyerFilter(event.target.value)} className={`${selectClass} mt-1`}><option value="">All buyers</option>{buyerIds.map((id) => <option key={id} value={id}>{id} · synthetic account</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Deal stage<select value={stage} onChange={(event) => setStage(event.target.value)} className={`${selectClass} mt-1`}><option value="">All stages</option>{DEAL_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Supply type<select value={supplyType} onChange={(event) => setSupplyType(event.target.value)} className={`${selectClass} mt-1`}><option value="">Trial and recurring</option><option value="TRIAL">Trial</option><option value="RECURRING">Recurring</option></select></label>
        <label className="text-xs font-medium text-slate-600">Destination<select value={destination} onChange={(event) => setDestination(event.target.value)} className={`${selectClass} mt-1`}><option value="">All destinations</option>{destinations.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><div><h2 className="text-sm font-semibold text-slate-900">Commercial pipeline</h2><p className="mt-1 text-xs text-slate-500">{records.length} deals · all fixture records are synthetic</p></div>{canCreateDeal && <Link href="/deals/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900"><Plus className="h-4 w-4" />Create Deal</Link>}</div>
        <div className="hidden overflow-x-auto lg:block"><table className="min-w-full text-left text-xs text-slate-700"><thead className="bg-slate-50 uppercase tracking-wide text-slate-500"><tr>{tableHeaders.map((item) => <th key={item} className="px-3 py-3 font-semibold">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{records.map((deal) => {
          const supplier = workspace.suppliers.find((item) => item.id === deal.supplierId);
          const product = workspace.products[deal.supplierId]?.find((item) => item.id === deal.productId);
          const terms = workspace.commercialTerms[deal.id];
          const commission = workspace.commissions[deal.id];
          const value = calculateDealValue(terms?.quantityMt, terms?.pricePerMt, terms?.currency);
          const estimate = calculateEstimatedCommission({ quantityMt: terms?.quantityMt, pricePerMt: terms?.pricePerMt, percentage: commission?.type === "PERCENTAGE" ? commission.percentage : undefined, fixedAmount: commission?.type === "FIXED" ? commission.fixedAmount : undefined, currency: commission?.currency ?? terms?.currency });
          return <tr key={deal.id} className="hover:bg-slate-50"><td className="px-3 py-3"><Link href={`/deals/${deal.id}`} className="font-semibold text-emerald-800 hover:text-emerald-950">{deal.id}</Link>{workspace.dealMetadata[deal.id]?.isDemoFixture && <div className="mt-1 text-[9px] font-semibold uppercase text-amber-800">Synthetic</div>}</td><td className="px-3 py-3">{deal.buyerId} · demo</td><td className="px-3 py-3">{supplier?.companyName ?? "Unknown supplier"}</td><td className="px-3 py-3">{product?.specification.commodity ?? "Unknown"} {product?.specification.productType ?? ""}</td>{canReadCommercial && <><td className="px-3 py-3">{terms?.quantityMt ?? "Unknown"} MT</td><td className="px-3 py-3">{terms?.currency ?? "Unknown"} {terms?.pricePerMt ?? "Unknown"}</td></>}<td className="px-3 py-3"><StatusBadge label={deal.status} /></td><td className="px-3 py-3">{workspace.dealMetadata[deal.id]?.supplyType ?? "Unknown"}</td>{canReadCommercial && <td className="px-3 py-3">{value ?? "Unknown"}<div className="mt-1 text-[9px] uppercase text-slate-500">{terms?.valueState ?? "Indicative"}</div></td>}{canReadCommission && <td className="px-3 py-3">{estimate ?? "Unknown"}<div className="mt-1 text-[9px] uppercase text-slate-500">Estimate · {commission?.status ?? "NOT AGREED"}</div></td>}</tr>;
        })}</tbody></table></div>
        <div className="space-y-2 p-3 lg:hidden">{records.map((deal) => {
          const supplier = workspace.suppliers.find((item) => item.id === deal.supplierId);
          const terms = workspace.commercialTerms[deal.id];
          const value = calculateDealValue(terms?.quantityMt, terms?.pricePerMt, terms?.currency);
          return <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-slate-900">{supplier?.companyName ?? deal.id}</div><div className="mt-1 text-xs text-slate-500">{deal.buyerId} · {workspace.dealMetadata[deal.id]?.supplyType}</div></div><StatusBadge label={deal.status} /></div>{canReadCommercial && <div className="mt-3 flex items-center justify-between text-xs"><span>{terms?.quantityMt ?? "Unknown"} MT · {terms?.currency ?? "Unknown"} {terms?.pricePerMt ?? "Unknown"}/MT</span><span>{value ?? "Value unknown"}</span></div>}<div className="mt-1 text-[10px] uppercase text-slate-500">{workspace.dealMetadata[deal.id]?.isDemoFixture ? "Synthetic fixture" : "Development deal"}</div></Link>;
        })}</div>
        {!records.length && <p className="p-8 text-center text-sm text-slate-500">No deals match these filters.</p>}
      </div>
    </div>
  );
}
