"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormSection, SelectInput, TextAreaInput, TextInput } from "@/components/supplier-workflow/form-controls";
import { OutreachDraftPanel } from "@/components/supplier-crm/outreach-draft-panel";
import { logSupplierCommunication } from "@/lib/data/supplier-workspace";
import { FOLLOW_UP_PRIORITIES } from "@/lib/domain/supplier-workflow";
import type { Supplier } from "@/lib/domain";
import { communicationSchema, type CommunicationInput, type CommunicationValues } from "@/lib/validation/supplier-schemas";

const communicationTypes = ["EMAIL", "PHONE", "WHATSAPP", "MEETING", "OTHER"] as const;
const directions = ["OUTBOUND", "INBOUND"] as const;
const options = (values: readonly string[]) => values.map((value) => ({ value, label: value.replaceAll("_", " ") }));

export function CommunicationForm({ supplier, onSaved }: { supplier: Supplier; onSaved: (direction: "OUTBOUND" | "INBOUND") => void }) {
  const form = useForm<CommunicationInput, unknown, CommunicationValues>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      type: "EMAIL", direction: "OUTBOUND", contactId: supplier.contacts.find((contact) => contact.isPrimary)?.id ?? "",
      requirementId: "", occurredAt: "", subject: "", summary: "", outcome: "", nextAction: "", followUpDate: "",
      followUpPriority: "MEDIUM", followUpOwner: "", internalNotes: "",
    },
  });
  const errors = form.formState.errors;
  const contactId = useWatch({ control: form.control, name: "contactId" });
  const requirementId = useWatch({ control: form.control, name: "requirementId" }) ?? "";

  function submit(values: CommunicationValues) {
    logSupplierCommunication(supplier.id, values);
    form.reset({
      type: values.type, direction: values.direction, contactId: values.contactId ?? "", requirementId: values.requirementId ?? "",
      occurredAt: "", subject: "", summary: "", outcome: "", nextAction: "", followUpDate: "",
      followUpPriority: "MEDIUM", followUpOwner: "", internalNotes: "",
    });
    onSaved(values.direction);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <FormSection title="Log communication" description="Record an interaction that occurred. This form does not send email, WhatsApp, or other messages." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectInput label="Communication type" registration={form.register("type")} options={options(communicationTypes)} error={errors.type?.message} required />
        <SelectInput label="Direction" registration={form.register("direction")} options={options(directions)} error={errors.direction?.message} required />
        <SelectInput label="Contact" registration={form.register("contactId")} options={[{ value: "", label: "No contact selected" }, ...supplier.contacts.map((contact) => ({ value: contact.id, label: contact.name }))]} error={errors.contactId?.message} />
        <TextInput label="Date and time" registration={form.register("occurredAt")} error={errors.occurredAt?.message} type="datetime-local" required />
        <TextInput label="Subject or purpose" registration={form.register("subject")} error={errors.subject?.message} required />
        <TextInput label="Outcome" registration={form.register("outcome")} error={errors.outcome?.message} />
      </div>
      <TextAreaInput label="Summary" registration={form.register("summary")} error={errors.summary?.message} rows={3} />
      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Optional follow-up</h3>
        <p className="mt-1 text-xs text-slate-500">A due date creates an open follow-up task; no notification is sent.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextInput label="Next action" registration={form.register("nextAction")} error={errors.nextAction?.message} />
          <TextInput label="Follow-up date" registration={form.register("followUpDate")} error={errors.followUpDate?.message} type="date" />
          <SelectInput label="Priority" registration={form.register("followUpPriority")} options={options(FOLLOW_UP_PRIORITIES)} error={errors.followUpPriority?.message} />
          <TextInput label="Assigned owner" registration={form.register("followUpOwner")} error={errors.followUpOwner?.message} placeholder="Unassigned" />
        </div>
      </div>
      <TextAreaInput label="Internal notes" registration={form.register("internalNotes")} error={errors.internalNotes?.message} />
      <details>
        <summary className="cursor-pointer text-sm font-medium text-emerald-800">Prepare a reusable message draft</summary>
        <div className="mt-3">
          <input type="hidden" {...form.register("requirementId")} />
          <OutreachDraftPanel
            supplier={supplier}
            contactId={contactId}
            requirementId={requirementId}
            onRequirementChange={(value) => form.setValue("requirementId", value, { shouldDirty: true })}
          />
        </div>
      </details>
      <Button type="submit" disabled={form.formState.isSubmitting}>Save communication log</Button>
    </form>
  );
}
