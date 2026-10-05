"use client";

import { useState } from "react";
import { Copy, CopyCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OUTREACH_TEMPLATES, buildOutreachDraft, type OutreachTemplateId } from "@/lib/data/outreach-templates";
import { buyerRequirements } from "@/lib/data/demo-data";
import type { Supplier } from "@/lib/domain";
import type { InformationRequestItemId } from "@/lib/domain/supplier-workflow";

export function OutreachDraftPanel({
  supplier,
  contactId,
  requirementId,
  onRequirementChange,
  requestedItemIds = [],
  initialTemplate = "INITIAL_INTRODUCTION",
}: {
  supplier: Supplier;
  contactId?: string;
  requirementId: string;
  onRequirementChange: (requirementId: string) => void;
  requestedItemIds?: InformationRequestItemId[];
  initialTemplate?: OutreachTemplateId;
}) {
  const [template, setTemplate] = useState<OutreachTemplateId>(initialTemplate);
  const [copied, setCopied] = useState(false);
  const contact = supplier.contacts.find((item) => item.id === contactId);
  const requirement = buyerRequirements.find((item) => item.id === requirementId && item.active);
  const draft = buildOutreachDraft({ template, supplier, contactName: contact?.name, requirement, requestedItemIds });

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">Message template
          <select value={template} onChange={(event) => setTemplate(event.target.value as OutreachTemplateId)} className="mt-1.5 block h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
            {OUTREACH_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Buyer requirement context (optional)
          <select value={requirementId} onChange={(event) => onRequirementChange(event.target.value)} className="mt-1.5 block h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
            <option value="">No requirement context</option>
            {buyerRequirements.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
      </div>
      {requirement && (
        <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950">
          <div className="font-semibold">Context included: {requirement.title}</div>
          <p className="mt-1">{requirement.commodity} {requirement.productType} · {requirement.commodity === "COPPER" ? "Cu" : requirement.commodity} ≥ {requirement.minimumGradePercent}%{requirement.minimumSulphurPercent === undefined ? "" : ` · S ≥ ${requirement.minimumSulphurPercent}%`} · Trial {requirement.trialQuantityMinMt ?? "—"}-{requirement.trialQuantityMaxMt ?? "—"} MT · Monthly ≥ {requirement.monthlyQuantityMt.toLocaleString("en-US")} MT · Destination {requirement.destinationCountry}</p>
          <p className="mt-1">Buyer identity and confidential commercial details are not included.</p>
        </div>
      )}
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Draft subject
        <input readOnly value={draft.subject} className="mt-1 block h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Draft message
        <textarea readOnly value={draft.body} rows={11} className="mt-1 block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case leading-6 tracking-normal text-slate-800" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={copyDraft}><Copy className="h-4 w-4" />{copied ? <><CopyCheck className="h-4 w-4" />Copied</> : "Copy draft"}</Button>
        <span className="text-xs text-amber-800">Draft only. MineralLink has not sent this message.</span>
      </div>
    </div>
  );
}
