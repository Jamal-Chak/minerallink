"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { SelectInput, TextAreaInput, TextInput } from "@/components/supplier-workflow/form-controls";
import { addSupplierDocument } from "@/lib/data/supplier-workspace";
import { SUPPLIER_DOCUMENT_TYPES } from "@/lib/domain/supplier-workflow";
import { VERIFICATION_STATUSES } from "@/lib/domain";
import { supplierDocumentSchema, type SupplierDocumentInput, type SupplierDocumentValues } from "@/lib/validation/supplier-schemas";

const options = (values: readonly string[]) => values.map((value) => ({ value, label: value.replaceAll("_", " ") }));

export function DocumentForm({ supplierId }: { supplierId: string }) {
  const form = useForm<SupplierDocumentInput, unknown, SupplierDocumentValues>({
    resolver: zodResolver(supplierDocumentSchema),
    defaultValues: {
      type: "OTHER", name: "", reference: "", issuedAt: "", expiresAt: "", status: "UNVERIFIED", notes: "",
    },
  });
  const errors = form.formState.errors;

  function onSubmit(values: SupplierDocumentValues) {
    addSupplierDocument(supplierId, values);
    form.reset();
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
        Metadata only in development mode. No file has been uploaded or stored. Add a reference or internal note so the team can locate evidence through its approved channel.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput label="Document type" registration={form.register("type")} options={options(SUPPLIER_DOCUMENT_TYPES)} error={errors.type?.message} required />
        <TextInput label="Document name" registration={form.register("name")} error={errors.name?.message} required />
        <TextInput label="Reference" registration={form.register("reference")} error={errors.reference?.message} />
        <SelectInput label="Verification status" registration={form.register("status")} options={options(VERIFICATION_STATUSES)} error={errors.status?.message} required />
        <TextInput label="Issued date" registration={form.register("issuedAt")} error={errors.issuedAt?.message} type="date" />
        <TextInput label="Expiry date" registration={form.register("expiresAt")} error={errors.expiresAt?.message} type="date" />
      </div>
      <TextAreaInput label="Internal notes" registration={form.register("notes")} error={errors.notes?.message} />
      <Button type="submit" disabled={form.formState.isSubmitting}>Record document metadata</Button>
    </form>
  );
}
