"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { FieldError, SelectInput, TextAreaInput, TextInput } from "@/components/supplier-workflow/form-controls";
import { OutreachDraftPanel } from "@/components/supplier-crm/outreach-draft-panel";
import { createInformationRequest, updateInformationItemStatus, updateSupplierPipeline } from "@/lib/data/supplier-workspace";
import { buildOutreachDraft } from "@/lib/data/outreach-templates";
import type { Supplier } from "@/lib/domain";
import { INFORMATION_ITEM_STATUSES, INFORMATION_REQUEST_ITEMS, FOLLOW_UP_PRIORITIES } from "@/lib/domain/supplier-workflow";
import type { InformationItemStatus, InformationRequestItemId, SupplierInformationRequest } from "@/lib/domain/supplier-workflow";
import type { BuyerRequirement } from "@/lib/domain";
import { informationRequestSchema, type InformationRequestInput, type InformationRequestValues } from "@/lib/validation/supplier-schemas";
import { can } from "@/lib/auth/permissions";

const options = (values: readonly string[]) => values.map((value) => ({ value, label: value.replaceAll("_", " ") }));

export function InformationRequestPanel({
  supplier,
  statuses,
  requests,
  requirements,
}: {
  supplier: Supplier;
  statuses: Record<InformationRequestItemId, InformationItemStatus>;
  requests: SupplierInformationRequest[];
  requirements: BuyerRequirement[];
}) {
  const { user } = useAuth();
  const canManage = can(user, "information.manage");
  const canManagePipeline = can(user, "supplier.pipeline.manage");
  const form = useForm<InformationRequestInput, unknown, InformationRequestValues>({
    resolver: zodResolver(informationRequestSchema),
    defaultValues: {
      itemIds: [], contactId: supplier.contacts.find((contact) => contact.isPrimary)?.id ?? "", dueAt: "",
      followUpPriority: "MEDIUM", followUpOwner: "", internalNote: "", requirementId: "",
    },
  });
  const itemIds = useWatch({ control: form.control, name: "itemIds" }) ?? [];
  const contactId = useWatch({ control: form.control, name: "contactId" }) ?? "";
  const requirementId = useWatch({ control: form.control, name: "requirementId" }) ?? "";
  const draftRequirements = requirements.filter((item) => item.active);
  const [showPipelineSuggestion, setShowPipelineSuggestion] = useState(false);

  function toggleItem(itemId: InformationRequestItemId, checked: boolean) {
    const next = checked ? [...itemIds, itemId] : itemIds.filter((id) => id !== itemId);
    form.setValue("itemIds", next, { shouldDirty: true, shouldValidate: true });
  }

  function submit(values: InformationRequestValues) {
    const contact = supplier.contacts.find((item) => item.id === values.contactId);
    const requirement = draftRequirements.find((item) => item.id === values.requirementId);
    const draft = buildOutreachDraft({ template: "DOCUMENT_REQUEST", supplier, contactName: contact?.name, requirement, requestedItemIds: values.itemIds });
    createInformationRequest(supplier.id, values, `${draft.subject}\n\n${draft.body}`);
    setShowPipelineSuggestion(true);
    form.reset({ itemIds: [], contactId: values.contactId ?? "", dueAt: "", followUpPriority: "MEDIUM", followUpOwner: "", internalNote: "", requirementId: values.requirementId ?? "" });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Information request checklist</h2>
          <p className="mt-1 text-xs text-slate-500">Collection state is separate from document verification. RECEIVED does not mean VERIFIED.</p>
        </div>
        {canManage ? <details>
          <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">Request Information / Documents</summary>
          <div className="mt-3 w-[min(80vw,760px)] rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
            <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectInput label="Contact" registration={form.register("contactId")} options={[{ value: "", label: "No contact selected" }, ...supplier.contacts.map((contact) => ({ value: contact.id, label: contact.name }))]} error={form.formState.errors.contactId?.message} />
                <label className="block text-sm font-medium text-slate-700">Active requirement context
                  <select {...form.register("requirementId")} className="mt-1.5 block h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                    <option value="">No requirement context</option>
                    {draftRequirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.title}</option>)}
                  </select>
                </label>
                <TextInput label="Follow-up due date" registration={form.register("dueAt")} error={form.formState.errors.dueAt?.message} type="date" />
                <SelectInput label="Follow-up priority" registration={form.register("followUpPriority")} options={options(FOLLOW_UP_PRIORITIES)} error={form.formState.errors.followUpPriority?.message} />
                <TextInput label="Assigned owner" registration={form.register("followUpOwner")} error={form.formState.errors.followUpOwner?.message} placeholder="Unassigned" />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-slate-900">Select information needed</legend>
                <FieldError message={form.formState.errors.itemIds?.message} />
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from(new Set(INFORMATION_REQUEST_ITEMS.map((item) => item.group))).map((group) => (
                    <div key={group} className="rounded-lg border border-slate-200 p-3">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</h3>
                      <div className="space-y-2">
                        {INFORMATION_REQUEST_ITEMS.filter((item) => item.group === group).map((item) => (
                          <label key={item.id} className="flex items-start gap-2 text-xs text-slate-700">
                            <input type="checkbox" checked={itemIds.includes(item.id)} onChange={(event) => toggleItem(item.id, event.target.checked)} className="mt-0.5 accent-emerald-700" />
                            <span>{item.label}<span className="ml-2 text-[10px] uppercase text-slate-400">{(statuses[item.id] ?? "NOT_REQUESTED").replaceAll("_", " ")}</span></span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
              <TextAreaInput label="Internal note" registration={form.register("internalNote")} error={form.formState.errors.internalNote?.message} rows={2} />
              <OutreachDraftPanel
                supplier={supplier}
                contactId={contactId}
                requirementId={requirementId}
                onRequirementChange={(value) => form.setValue("requirementId", value, { shouldDirty: true })}
                requestedItemIds={itemIds}
                initialTemplate="DOCUMENT_REQUEST"
              />
              <Button type="submit">Record request draft</Button>
            </form>
          </div>
        </details> : <span className="text-xs text-slate-500">Read-only for your role.</span>}
      </div>

      {canManagePipeline && showPipelineSuggestion && supplier.pipelineStatus !== "DOCUMENTS_REQUESTED" && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm"><span className="text-sky-950">Suggested pipeline stage: <strong>DOCUMENTS REQUESTED</strong>. The request is a local draft and was not sent.</span><div className="flex gap-2"><Button type="button" size="sm" onClick={() => { updateSupplierPipeline(supplier.id, "DOCUMENTS_REQUESTED"); setShowPipelineSuggestion(false); }}>Apply suggestion</Button><Button type="button" size="sm" variant="outline" onClick={() => setShowPipelineSuggestion(false)}>Dismiss</Button></div></div>}

      <div className="mt-4 divide-y divide-slate-100">
        {INFORMATION_REQUEST_ITEMS.map((item) => (
          <div key={item.id} className="grid gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
            <span className="text-sm text-slate-800">{item.label}<span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">{item.group}</span></span>
            <select aria-label={`${item.label} collection status`} disabled={!canManage} value={statuses[item.id] ?? "NOT_REQUESTED"} onChange={(event) => updateInformationItemStatus(supplier.id, item.id, event.target.value as InformationItemStatus)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 disabled:bg-slate-100">
              {INFORMATION_ITEM_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Request history</h3>
        {!requests.length ? <p className="text-sm text-slate-500">No information request drafts recorded.</p> : <div className="space-y-2">
          {requests.map((request) => {
            const contact = supplier.contacts.find((item) => item.id === request.contactId);
            const requestedLabels = request.itemIds.map((id) => INFORMATION_REQUEST_ITEMS.find((item) => item.id === id)?.label ?? id);
            return <article key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-900">{request.itemIds.length} items · {request.requestedAt.slice(0, 10)}</span><span className="font-medium text-amber-800">DRAFT NOT SENT</span></div>
            <p className="mt-1 text-slate-600">Contact: {contact?.name ?? "Not selected"} · Follow-up: {request.dueAt ?? "Not scheduled"} · {request.internalNote ?? "No internal note"}</p>
            <p className="mt-2 text-slate-700">{requestedLabels.join(" · ")}</p>
            <details className="mt-2"><summary className="cursor-pointer font-medium text-emerald-800">View saved draft</summary><pre className="mt-2 whitespace-pre-wrap rounded-md bg-white p-3 font-sans leading-5 text-slate-700">{request.draftMessage}</pre></details>
          </article>;
          })}
        </div>}
      </div>
    </section>
  );
}
