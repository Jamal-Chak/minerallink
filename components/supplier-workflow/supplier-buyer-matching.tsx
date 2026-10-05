"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, SearchCheck } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/auth/permissions";
import { recordBuyerMatch } from "@/lib/data/supplier-workspace";
import type { BuyerRequirement, MineralProduct } from "@/lib/domain";
import type { SupplierAssay } from "@/lib/domain/supplier-workflow";
import { matchMineralProduct, productWithAssay } from "@/lib/matching";

export interface SupplierMatchSummary {
  requirementTitle: string;
  status: "MATCH" | "PARTIAL" | "NO_MATCH";
}

function formatValue(value: number | string | boolean | null, field: string): string {
  if (value === null) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const unit = field === "particleSizeMm" ? " mm" : field === "monthlyCapacityMt" ? " MT" : field.toLowerCase().includes("percent") || field.includes("impurities.") || field === "gradePercent" || field === "sulphurPercent" ? "%" : "";
    return `${value}${unit}`;
  }
  return value;
}

function requiredLabel(operator: string, value: number | string | boolean, field: string): string {
  const symbol = operator === "MIN" ? "≥" : operator === "MAX" ? "≤" : operator === "IN" ? "in" : "=";
  return `${symbol} ${formatValue(value, field)}`;
}

export function SupplierBuyerMatching({
  supplierId,
  products,
  assays = [],
  requirements,
  onChecked,
}: {
  supplierId: string;
  products: MineralProduct[];
  assays: SupplierAssay[];
  requirements: BuyerRequirement[];
  onChecked?: (matches: SupplierMatchSummary[]) => void;
}) {
  const { user } = useAuth();
  const canRecordMatch = can(user, "match.audit");
  const [checked, setChecked] = useState(false);
  const pairs = products.flatMap((product) => requirements.filter((requirement) => requirement.active).map((requirement) => {
    const assay = assays.filter((item) => item.productId === product.id).at(-1);
    return {
      product,
      requirement,
      assay,
      result: matchMineralProduct(productWithAssay(product, assay), requirement),
    };
  }));

  function runCheck() {
    setChecked(true);
    onChecked?.(pairs.map(({ requirement, result }) => ({ requirementTitle: requirement.title, status: result.status })));
    for (const pair of pairs) recordBuyerMatch(supplierId, pair.requirement.title, pair.result.status);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Buyer match screening</h2>
          <p className="mt-1 text-xs text-slate-500">Existing matching engine · active requirements · supplier-provided product specifications</p>
        </div>
        <Button type="button" onClick={runCheck} disabled={pairs.length === 0 || !canRecordMatch}>
          <SearchCheck className="h-4 w-4" />
          Check Buyer Match
        </Button>
      </div>
      <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950">
        Technical matching is not assay verification, supplier verification, or qualification. No status changes when a match is found.
      </div>
      {!canRecordMatch ? <p className="mt-4 text-sm text-slate-500">Your role can review existing match information but cannot run or audit a new match check.</p> : !pairs.length ? (
        <p className="mt-4 text-sm text-slate-500">Add a product and ensure an active buyer requirement exists to run match screening.</p>
      ) : !checked ? (
        <p className="mt-4 text-sm text-slate-500">{pairs.length} product-to-requirement comparisons are available. Run the check to inspect each criterion.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {pairs.map(({ product, requirement, assay, result }) => (
            <article key={`${product.id}-${requirement.id}`} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-xs text-slate-500">{product.name} <ArrowRight className="inline h-3 w-3" /> {requirement.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>Passed <strong className="text-slate-900">{result.passed}</strong></span>
                    <span>Failed <strong className="text-slate-900">{result.failed}</strong></span>
                    <span>Missing <strong className="text-slate-900">{result.missing}</strong></span>
                  </div>
                </div>
                <StatusBadge label={result.status === "NO_MATCH" ? "NO MATCH" : result.status} />
              </div>
              <div className="divide-y divide-slate-100">
                {result.checks.map((check) => {
                  const assayField = ["gradePercent", "sulphurPercent", "particleSizeMm"].includes(check.field) || check.field.startsWith("impurities.");
                  const evidenceSource = assayField && assay
                    ? assay.source === "SUPPLIER" ? "Supplier assay" : `${assay.source} assay`
                    : "Supplier product";
                  return (
                    <div key={check.field} className="grid gap-2 px-4 py-2.5 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(110px,0.8fr)_minmax(110px,0.8fr)_80px] sm:items-center">
                      <span className="font-medium text-slate-800">{check.label}</span>
                      <span className="text-slate-600">{evidenceSource}: {formatValue(check.actual, check.field)}</span>
                      <span className="text-slate-600">Requirement: {requiredLabel(check.operator, check.required, check.field)}</span>
                      <span className="sm:text-right"><StatusBadge label={check.status} /></span>
                    </div>
                  );
                })}
              </div>
              {result.status === "MATCH" && <div className="flex justify-end border-t border-slate-200 bg-white px-4 py-3"><Link href={`/deals/new?supplierId=${encodeURIComponent(supplierId)}&productId=${encodeURIComponent(product.id)}&requirementId=${encodeURIComponent(requirement.id)}&fromMatch=1`} className="inline-flex h-9 items-center rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900">Create Deal</Link></div>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
