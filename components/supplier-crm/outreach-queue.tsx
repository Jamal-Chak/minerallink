"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, MessageSquarePlus } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { useSupplierWorkspace } from "@/lib/data/use-supplier-workspace";
import { COMMODITIES, SUPPLIER_PIPELINE_STATUSES, SUPPLIER_TYPES, VERIFICATION_STATUSES } from "@/lib/domain";
import { SUPPLIER_OUTREACH_STATUSES } from "@/lib/domain/supplier-workflow";

const selectClass = "h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800";
export function OutreachQueue() {
  const { workspace } = useSupplierWorkspace();
  const [query, setQuery] = useState("");
  const [commodity, setCommodity] = useState("");
  const [country, setCountry] = useState("");
  const [supplierType, setSupplierType] = useState("");
  const [verification, setVerification] = useState("");
  const [pipeline, setPipeline] = useState("");
  const [outreach, setOutreach] = useState("");
  const countries = [...new Set(workspace.suppliers.map((supplier) => supplier.country))].sort();

  const suppliers = useMemo(() => workspace.suppliers.filter((supplier) => {
    const product = workspace.products[supplier.id]?.[0];
    const status = workspace.outreachStatuses[supplier.id] ?? "NOT_CONTACTED";
    const needle = query.trim().toLowerCase();
    const textMatch = !needle || [supplier.companyName, supplier.country, supplier.mineOrProjectName ?? "", product?.name ?? "", supplier.contacts[0]?.name ?? ""].some((value) => value.toLowerCase().includes(needle));
    return textMatch
      && (!commodity || product?.specification.commodity === commodity)
      && (!country || supplier.country === country)
      && (!supplierType || supplier.supplierType === supplierType)
      && (!verification || supplier.verificationStatus === verification)
      && (!pipeline || supplier.pipelineStatus === pipeline)
      && (!outreach || status === outreach);
  }), [commodity, country, outreach, pipeline, query, supplierType, verification, workspace.outreachStatuses, workspace.products, workspace.suppliers]);

  const needsAttention = suppliers.filter((supplier) => ["NOT_CONTACTED", "FOLLOW_UP_REQUIRED", "NO_RESPONSE"].includes(workspace.outreachStatuses[supplier.id] ?? "NOT_CONTACTED")).length;
  const getLabel = (value: string, all: string) => [{ value: "", label: all }, ...value.split("|").map((item) => ({ value: item, label: item.replaceAll("_", " ") }))];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Need outreach</div><div className="mt-1 text-xl font-semibold text-slate-900">{needsAttention}</div></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Awaiting response</div><div className="mt-1 text-xl font-semibold text-slate-900">{workspace.suppliers.filter((supplier) => workspace.outreachStatuses[supplier.id] === "AWAITING_RESPONSE").length}</div></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">In discussion</div><div className="mt-1 text-xl font-semibold text-slate-900">{workspace.suppliers.filter((supplier) => workspace.outreachStatuses[supplier.id] === "IN_DISCUSSION").length}</div></div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-medium text-slate-600">Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Supplier, contact, mineral..." className={`${selectClass} mt-1`} /></label>
        <label className="text-xs font-medium text-slate-600">Commodity<select value={commodity} onChange={(event) => setCommodity(event.target.value)} className={`${selectClass} mt-1`}>{[{ value: "", label: "All commodities" }, ...getLabel(COMMODITIES.join("|"), "All commodities") .slice(1)].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Country<select value={country} onChange={(event) => setCountry(event.target.value)} className={`${selectClass} mt-1`}><option value="">All countries</option>{countries.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Supplier type<select value={supplierType} onChange={(event) => setSupplierType(event.target.value)} className={`${selectClass} mt-1`}><option value="">All supplier types</option>{SUPPLIER_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Verification<select value={verification} onChange={(event) => setVerification(event.target.value)} className={`${selectClass} mt-1`}><option value="">All verification statuses</option>{VERIFICATION_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Pipeline<select value={pipeline} onChange={(event) => setPipeline(event.target.value)} className={`${selectClass} mt-1`}><option value="">All pipeline stages</option>{SUPPLIER_PIPELINE_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Outreach status<select value={outreach} onChange={(event) => setOutreach(event.target.value)} className={`${selectClass} mt-1`}><option value="">All outreach statuses</option>{SUPPLIER_OUTREACH_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-900">Sourcing queue</span><span className="text-xs text-slate-500">{suppliers.length} suppliers · {needsAttention} need attention</span>
        </div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase tracking-wide text-slate-500"><tr>{["Supplier", "Country", "Commodity", "Contact", "Outreach", "Pipeline", "Verification", "Next action"].map((head) => <th key={head} className="px-3 py-3 font-semibold">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((supplier) => {
                const product = workspace.products[supplier.id]?.[0];
                const communication = workspace.communications[supplier.id]?.[0];
                const status = workspace.outreachStatuses[supplier.id] ?? "NOT_CONTACTED";
                return <tr key={supplier.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3"><Link href={`/suppliers/${supplier.id}#outreach`} className="font-semibold text-slate-900 hover:text-emerald-800">{supplier.companyName}<ArrowUpRight className="ml-1 inline h-3 w-3" /></Link>{workspace.metadata[supplier.id]?.isDemoFixture && <div className="mt-1 text-[9px] font-semibold uppercase text-amber-800">Synthetic fixture</div>}</td>
                  <td className="px-3 py-3">{supplier.country}</td><td className="px-3 py-3">{product?.specification.commodity ?? "—"}</td><td className="px-3 py-3">{supplier.contacts[0]?.name ?? "No contact"}</td>
                  <td className="px-3 py-3"><StatusBadge label={status.replaceAll("_", " ")} /></td><td className="px-3 py-3"><StatusBadge label={supplier.pipelineStatus} /></td><td className="px-3 py-3"><StatusBadge label={supplier.verificationStatus.replaceAll("_", " ")} /></td>
                  <td className="max-w-64 px-3 py-3"><div className="line-clamp-2">{communication?.nextAction ?? communication?.outcome ?? "No action recorded"}</div><Link href={`/suppliers/${supplier.id}#outreach`} className="mt-1 inline-flex items-center gap-1 font-semibold text-emerald-800"><MessageSquarePlus className="h-3 w-3" /> Open outreach</Link></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 p-3 lg:hidden">
          {suppliers.map((supplier) => {
            const product = workspace.products[supplier.id]?.[0];
            const status = workspace.outreachStatuses[supplier.id] ?? "NOT_CONTACTED";
            return <Link key={supplier.id} href={`/suppliers/${supplier.id}#outreach`} className="block rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2"><div className="font-semibold text-slate-900">{supplier.companyName}<div className="mt-1 text-xs font-normal text-slate-500">{supplier.country} · {product?.specification.commodity ?? "No commodity"}</div></div><StatusBadge label={status.replaceAll("_", " ")} /></div>
              <div className="mt-2 flex flex-wrap gap-2"><StatusBadge label={supplier.pipelineStatus} /><StatusBadge label={supplier.verificationStatus.replaceAll("_", " ")} /></div>
              <div className="mt-2 text-xs text-slate-600">{supplier.contacts[0]?.name ?? "No contact"} · {workspace.communications[supplier.id]?.[0]?.nextAction ?? "No next action"}</div>
            </Link>;
          })}
        </div>
        {!suppliers.length && <p className="p-6 text-center text-sm text-slate-500">No suppliers match these outreach filters.</p>}
      </div>
    </div>
  );
}
