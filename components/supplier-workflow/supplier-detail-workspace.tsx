"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ClipboardCheck, FilePlus2, MapPin, PackagePlus, ShieldCheck } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { useSupplierWorkspace } from "@/lib/data/use-supplier-workspace";
import type { SupplierAssay } from "@/lib/domain/supplier-workflow";
import { buyerRequirements } from "@/lib/data/demo-data";
import { AssayForm } from "@/components/supplier-workflow/assay-form";
import { DocumentForm } from "@/components/supplier-workflow/document-form";
import { MineralProductForm } from "@/components/supplier-workflow/mineral-product-form";
import { PipelineSelector } from "@/components/supplier-workflow/pipeline-selector";
import { QualificationSummary } from "@/components/supplier-workflow/qualification-summary";
import { SupplierActivityTimeline } from "@/components/supplier-workflow/supplier-activity-timeline";
import { SupplierBuyerMatching } from "@/components/supplier-workflow/supplier-buyer-matching";
import type { SupplierMatchSummary } from "@/components/supplier-workflow/supplier-buyer-matching";
import { SupplierDocumentRegister } from "@/components/supplier-workflow/supplier-document-register";
import { VerificationChecklist } from "@/components/supplier-workflow/verification-checklist";
import { VerificationDecision } from "@/components/supplier-workflow/verification-decision";
import { CommunicationHistory } from "@/components/supplier-crm/communication-history";
import { InformationRequestPanel } from "@/components/supplier-crm/information-request-panel";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { SupplierDealsPanel } from "@/components/deals/supplier-deals-panel";
import { INFORMATION_REQUEST_ITEMS } from "@/lib/domain/supplier-workflow";
import type { InformationItemStatus, InformationRequestItemId } from "@/lib/domain/supplier-workflow";

const quantityFormatter = new Intl.NumberFormat("en-US");

function AssayRecord({ assay }: { assay: SupplierAssay }) {
  const sourceLabel = assay.source === "SUPPLIER"
    ? "Supplier-reported assay"
    : ["SGS", "CCIC", "LABORATORY"].includes(assay.source)
      ? `Independent source recorded: ${assay.source}`
      : "Other stated source";
  const values = [
    ["Grade", assay.gradePercent, "%"], ["Sulphur", assay.sulphurPercent, "%"],
    ["Arsenic", assay.arsenicPercent, "%"], ["Chlorine", assay.chlorinePercent, "%"],
    ["Cadmium", assay.cadmiumPercent, "%"], ["Mercury", assay.mercuryPercent, "%"],
    ["Fluorine", assay.fluorinePercent, "%"], ["Lead", assay.leadPercent, "%"],
    ["Zinc", assay.zincPercent, "%"], ["Particle size", assay.particleSizeMm, " mm"],
  ] as const;
  const independent = ["SGS", "CCIC", "LABORATORY"].includes(assay.source);

  return (
    <article className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-900">{sourceLabel}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {assay.laboratoryName ?? "Laboratory not provided"} · Ref {assay.certificateRef ?? "not provided"} · Tested {assay.testedAt ?? "date not provided"}
          </p>
        </div>
        <StatusBadge label={independent ? "INDEPENDENT SOURCE" : assay.source === "SUPPLIER" ? "SUPPLIER REPORTED" : "SOURCE NOT CLASSIFIED"} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {values.map(([label, value, unit]) => (
          <div key={label} className="rounded-md bg-slate-50 p-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-medium text-slate-900">{value === undefined ? "Not provided" : `${value}${unit}`}</div>
          </div>
        ))}
      </div>
      {assay.notes && <p className="mt-2 text-xs text-slate-600">{assay.notes}</p>}
      {independent && <p className="mt-2 text-xs text-amber-800">Source recorded as independent; document review and verification remain separate workflow decisions.</p>}
    </article>
  );
}

export function SupplierDetailWorkspace({ supplierId }: { supplierId: string }) {
  const { user } = useAuth();
  const { workspace, ready } = useSupplierWorkspace();
  const [matchSummaries, setMatchSummaries] = useState<SupplierMatchSummary[]>([]);
  const supplier = workspace.suppliers.find((item) => item.id === supplierId);

  if (!supplier) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">{ready ? "Supplier not found in this browser workspace." : "Loading supplier workspace…"}</p>
        <Link href="/suppliers" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-800"><ArrowLeft className="h-4 w-4" /> Back to suppliers</Link>
      </div>
    );
  }

  const products = workspace.products?.[supplierId] ?? [];
  const assays = workspace.assays?.[supplierId] ?? [];
  const documents = workspace.documents?.[supplierId] ?? [];
  const checks = workspace.checks?.[supplierId] ?? [];
  const activities = workspace.activities?.[supplierId] ?? [];
  const communications = workspace.communications?.[supplierId] ?? [];
  const outreachStatus = workspace.outreachStatuses?.[supplierId] ?? "NOT_CONTACTED";
  const informationStatuses = workspace.informationStatuses?.[supplierId] ?? Object.fromEntries(INFORMATION_REQUEST_ITEMS.map((item) => [item.id, "NOT_REQUESTED"])) as Record<InformationRequestItemId, InformationItemStatus>;
  const informationRequests = (workspace.informationRequests ?? []).filter((request) => request.supplierId === supplierId);
  const supplierDeals = workspace.deals.filter((deal) => deal.supplierId === supplierId);
  const metadata = workspace.metadata?.[supplierId] ?? {
    source: "Not recorded", isDemoFixture: false, supplyCountry: supplier.country, availableForExport: false,
  };
  const totalCapacity = products.reduce((sum, product) => sum + (product.monthlyCapacityMt ?? 0), 0);
  const totalTrial = Math.max(0, ...products.map((product) => product.trialQuantityMt ?? 0));
  const verifiedDocuments = documents.filter((document) => document.status === "VERIFIED").length;
  const canEditProducts = can(user, "supplier.update");
  const canManageEvidence = can(user, "supplier.evidence.manage");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to suppliers</Link>
        <div className="flex flex-wrap items-center gap-2"><StatusBadge label={supplier.verificationStatus} /><StatusBadge label={supplier.pipelineStatus} /><StatusBadge label={outreachStatus.replaceAll("_", " ")} /></div>
      </div>

      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Supplier qualification workspace</div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{supplier.companyName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <span>{supplier.tradingName ?? supplier.country}</span><span aria-hidden="true">·</span><span>{supplier.country}</span><span aria-hidden="true">·</span><span>{supplier.supplierType}</span>
              {supplier.mineOrProjectName && <><span aria-hidden="true">·</span><span>{supplier.mineOrProjectName}</span></>}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <PipelineSelector supplierId={supplierId} currentStatus={supplier.pipelineStatus} />
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="font-medium text-slate-800">Verification is separate</div>
              <div className="mt-1">Current decision: <strong>{supplier.verificationStatus.replaceAll("_", " ")}</strong></div>
            </div>
          </div>
        </div>
      </header>

      <QualificationSummary
        supplier={supplier}
        metadata={metadata}
        products={products}
        assays={assays}
        documents={documents}
        checks={checks}
        matches={matchSummaries}
      />

      <SupplierDealsPanel supplierId={supplierId} verificationStatus={supplier.verificationStatus} pipelineStatus={supplier.pipelineStatus} deals={supplierDeals} metadata={workspace.dealMetadata} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-500" /><h2 className="font-semibold text-slate-900">Identity and supply profile</h2></div>
            <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Legal company", supplier.companyName], ["Trading name", supplier.tradingName ?? "Not provided"],
                ["Country", supplier.country], ["Supplier type", supplier.supplierType], ["Production", supplier.productionStatus],
                ["Website", supplier.website ?? "Not provided"], ["Source", metadata.source], ["Loading country", metadata.supplyCountry],
                ["Loading location", metadata.loadingLocation ?? "Not provided"], ["Export capability", metadata.availableForExport ? "Supplier stated" : "Not stated"],
              ].map(([label, value]) => <div key={label}><dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd></div>)}
            </dl>
            {supplier.notes && <p className="mt-4 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-700">{supplier.notes}</p>}
            <div className="mt-4 border-t border-slate-200 pt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contacts</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {supplier.contacts.map((contact) => <div key={contact.id} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="font-medium text-slate-900">{contact.name}{contact.isPrimary ? " · Primary" : ""}</div><div className="mt-1 text-xs text-slate-600">{contact.jobTitle ?? "Title not provided"} · {contact.email ?? "Email not provided"} · {contact.phone ?? "Phone not provided"}</div></div>)}
              </div>
            </div>
          </section>

          <div id="outreach">
            <CommunicationHistory supplier={supplier} communications={communications} outreachStatus={outreachStatus} />
          </div>

          <InformationRequestPanel supplier={supplier} statuses={informationStatuses} requests={informationRequests} requirements={buyerRequirements} />

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2"><PackagePlus className="h-4 w-4 text-slate-500" /><div><h2 className="font-semibold text-slate-900">Mineral products</h2><p className="mt-1 text-xs text-slate-500">{products.length} products · supplier-provided specifications</p></div></div>
              {canEditProducts && <details className="group">
                <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"><PackagePlus className="h-4 w-4" /> Add product</summary>
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><MineralProductForm supplierId={supplierId} /></div>
              </details>}
            </div>
            {!products.length ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No product specifications have been recorded.</p> : <div className="space-y-3">
              {products.map((product) => <article key={product.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-slate-900">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.specification.commodity} · {product.specification.productType} · {product.specification.mineralForm ?? "Form not provided"}</p></div><StatusBadge label="SUPPLIER REPORTED" /></div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Grade", `${product.specification.gradePercent}%`], ["Sulphur", product.specification.sulphurPercent === undefined ? "Not provided" : `${product.specification.sulphurPercent}%`],
                    ["Available", product.availableQuantityMt === undefined ? "Not provided" : `${quantityFormatter.format(product.availableQuantityMt)} MT`], ["Monthly capacity", product.monthlyCapacityMt === undefined ? "Not provided" : `${quantityFormatter.format(product.monthlyCapacityMt)} MT`],
                    ["Trial", product.trialQuantityMt === undefined ? "Not provided" : `${quantityFormatter.format(product.trialQuantityMt)} MT`], ["Particle size", product.specification.particleSizeMm === undefined ? "Not provided" : `${product.specification.particleSizeMm} mm`],
                    ["Loading location", product.loadingLocation ?? "Not provided"], ["Export", product.availableForExport ? "Supplier stated" : "Not stated"],
                  ].map(([label, value]) => <div key={label} className="rounded-md bg-slate-50 p-2"><div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-xs font-semibold text-slate-900">{value}</div></div>)}
                </div>
              </article>)}
            </div>}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Assays</h2><p className="mt-1 text-xs text-slate-500">Reported source remains visible; source entry alone does not verify evidence.</p></div></div>
            <div className="space-y-4">
              {products.map((product) => <div key={product.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium text-slate-800">{product.name}</h3>{canManageEvidence && <details>
                  <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-300 px-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50"><FilePlus2 className="h-3.5 w-3.5" /> Record assay</summary>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3"><AssayForm supplierId={supplierId} productId={product.id} /></div>
                </details>}</div>
                {assays.filter((assay) => assay.productId === product.id).map((assay) => <AssayRecord key={assay.id} assay={assay} />)}
                {!assays.some((assay) => assay.productId === product.id) && <p className="text-xs text-slate-500">No assay values recorded for this product.</p>}
              </div>)}
              {!products.length && <p className="text-sm text-slate-500">Add a product before recording an assay.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Documents</h2><p className="mt-1 text-xs text-slate-500">{verifiedDocuments} / {documents.length} metadata records marked verified</p></div>{canManageEvidence && <details>
              <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"><FilePlus2 className="h-4 w-4" /> Record document</summary>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><DocumentForm supplierId={supplierId} /></div>
            </details>}</div>
            <SupplierDocumentRegister supplierId={supplierId} documents={documents} />
          </section>

          <SupplierBuyerMatching supplierId={supplierId} products={products} assays={assays} requirements={buyerRequirements} onChecked={setMatchSummaries} />
          <SupplierActivityTimeline items={activities} />
        </div>

        <aside className="space-y-5">
          <VerificationChecklist supplierId={supplierId} checks={checks} />
          <VerificationDecision key={supplier.verificationStatus} supplierId={supplierId} currentStatus={supplier.verificationStatus} />
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-slate-500" /><div><h2 className="font-semibold text-slate-900">Qualification dimensions</h2><p className="mt-1 text-xs text-slate-500">Separate evidence tracks, not a score.</p></div></div>
            <div className="space-y-2 text-sm">
              {[
                ["Supplier identity", supplier.companyName && supplier.country ? "Recorded" : "Incomplete"],
                ["Documents", `${verifiedDocuments} verified / ${documents.length} recorded`],
                ["Verification", supplier.verificationStatus.replaceAll("_", " ")],
                ["Product specification", `${products.length} product${products.length === 1 ? "" : "s"}`],
                ["Assay quality", `${assays.length} assay entr${assays.length === 1 ? "y" : "ies"}`],
                ["Export capability", metadata.availableForExport ? "Supplier stated" : "Not stated"],
                ["Commercial capacity", totalCapacity ? `${quantityFormatter.format(totalCapacity)} MT / month` : "Not provided"],
                ["Trial quantity", totalTrial ? `${quantityFormatter.format(totalTrial)} MT` : "Not provided"],
              ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"><span className="text-xs text-slate-600">{label}</span><span className="text-right text-xs font-medium text-slate-900">{value}</span></div>)}
            </div>
            <p className="mt-3 text-xs leading-5 text-amber-900">A mineral match is not a VERIFIED or QUALIFIED supplier. Qualification remains an explicit internal decision.</p>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /><h2 className="font-semibold text-slate-900">Record provenance</h2></div>
            <div className="text-sm text-slate-700">{metadata.isDemoFixture ? "Synthetic development fixture" : "Entered in local development workspace"}</div>
            <div className="mt-1 text-xs text-slate-500">Browser-local changes · not connected to Prisma in this phase</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
