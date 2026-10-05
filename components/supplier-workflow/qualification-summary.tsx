import { StatusBadge } from "@/components/status-badge";
import type { MineralProduct, Supplier } from "@/lib/domain";
import type { SupplierAssay, SupplierDocumentRecord, SupplierVerificationCheck, SupplierWorkflowMetadata } from "@/lib/domain/supplier-workflow";

const quantityFormatter = new Intl.NumberFormat("en-US");

interface MatchSummary {
  requirementTitle: string;
  status: "MATCH" | "PARTIAL" | "NO_MATCH";
}

export function QualificationSummary({
  supplier,
  metadata,
  products,
  assays,
  documents,
  checks,
  matches,
}: {
  supplier: Supplier;
  metadata: SupplierWorkflowMetadata;
  products: MineralProduct[];
  assays: SupplierAssay[];
  documents: SupplierDocumentRecord[];
  checks: SupplierVerificationCheck[];
  matches: MatchSummary[];
}) {
  const identityComplete = Boolean(supplier.companyName && supplier.country && supplier.supplierType && supplier.contacts.some((contact) => contact.name));
  const verifiedDocs = documents.filter((document) => document.status === "VERIFIED").length;
  const independentAssays = assays.filter((assay) => ["SGS", "CCIC", "LABORATORY"].includes(assay.source)).length;
  const capacity = products.reduce((sum, product) => sum + (product.monthlyCapacityMt ?? 0), 0);
  const trialQuantity = Math.max(0, ...products.map((product) => product.trialQuantityMt ?? 0));
  const completedChecks = checks.filter((check) => check.status === "VERIFIED").length;

  const rows = [
    { label: "Supplier identity", value: identityComplete ? "Core details recorded" : "Incomplete", state: identityComplete ? "RECORDED" : "MISSING" },
    { label: "Documents", value: `${verifiedDocs} verified · ${documents.length} metadata records`, state: verifiedDocs > 0 ? "RECORDED" : "MISSING" },
    { label: "Assay quality", value: assays.length === 0 ? "No assay entered" : `${independentAssays} independent-source recorded · ${assays.length - independentAssays} supplier / other`, state: independentAssays > 0 ? "SOURCE RECORDED" : assays.length ? "SUPPLIER REPORTED" : "MISSING" },
    { label: "Export capability", value: metadata.availableForExport ? "Supplier stated" : "Not stated", state: metadata.availableForExport ? "SUPPLIER STATED" : "MISSING" },
    { label: "Monthly capacity", value: capacity ? `${quantityFormatter.format(capacity)} MT` : "Not provided", state: capacity ? "RECORDED" : "MISSING" },
    { label: "Trial quantity", value: trialQuantity ? `${quantityFormatter.format(trialQuantity)} MT` : "Not provided", state: trialQuantity ? "RECORDED" : "MISSING" },
    { label: "Buyer match", value: matches.length ? matches.map((match) => `${match.requirementTitle}: ${match.status}`).join(" · ") : "Not checked", state: matches.length ? "SCREENED" : "NOT CHECKED" },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Operational snapshot</div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Qualification summary</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={supplier.verificationStatus} />
          <StatusBadge label={supplier.pipelineStatus} />
        </div>
      </div>
      {metadata.isDemoFixture && <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">Synthetic development fixture. Statuses and profile details are not claims about a real supplier or genuine evidence.</div>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{row.label}</div>
            <div className="mt-1.5 text-sm font-semibold text-slate-900">{row.value}</div>
            <div className="mt-2"><StatusBadge label={row.state} /></div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
        <span>Checklist: {completedChecks} / {checks.length} complete</span>
        <span>Qualification is a human decision across identity, documents, assay quality, export, capacity, and match.</span>
      </div>
    </section>
  );
}
