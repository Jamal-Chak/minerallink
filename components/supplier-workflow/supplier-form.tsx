"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { CheckboxInput, FormSection, SelectInput, TextAreaInput, TextInput } from "@/components/supplier-workflow/form-controls";
import { createSupplier } from "@/lib/data/supplier-workspace";
import { PRODUCTION_STATUSES, SUPPLIER_TYPES } from "@/lib/domain";
import {
  supplierOnboardingSchema,
  type SupplierOnboardingInput,
  type SupplierOnboardingValues,
} from "@/lib/validation/supplier-schemas";

const options = <T extends readonly string[]>(values: T) => values.map((value) => ({ value, label: value.replaceAll("_", " ") }));

export function SupplierForm() {
  const router = useRouter();
  const form = useForm<SupplierOnboardingInput, unknown, SupplierOnboardingValues>({
    resolver: zodResolver(supplierOnboardingSchema),
    defaultValues: {
      companyName: "",
      tradingName: "",
      country: "",
      supplierType: undefined,
      website: "",
      mineOrProjectName: "",
      productionStatus: "UNKNOWN",
      contactName: "",
      contactJobTitle: "",
      contactEmail: "",
      contactPhone: "",
      supplyCountry: "",
      loadingLocation: "",
      availableForExport: false,
      source: "",
      notes: "",
    },
  });

  function onSubmit(values: SupplierOnboardingValues) {
    const supplierId = createSupplier(values);
    router.push(`/suppliers/${supplierId}`);
  }

  const errors = form.formState.errors;
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Browser development mode: records are saved to this browser only. New suppliers start as <strong>UNVERIFIED</strong> and <strong>NEW</strong>.
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <FormSection title="Company" description="Use the legal entity name where available. Supplier type is recorded as provided, not inferred." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextInput label="Legal company name" registration={form.register("companyName")} error={errors.companyName?.message} required />
          <TextInput label="Trading name" registration={form.register("tradingName")} error={errors.tradingName?.message} />
          <TextInput label="Country" registration={form.register("country")} error={errors.country?.message} required placeholder="Country" />
          <SelectInput label="Supplier type" registration={form.register("supplierType")} options={[{ value: "", label: "Select supplier type" }, ...options(SUPPLIER_TYPES)]} error={errors.supplierType?.message} required />
          <SelectInput label="Production status" registration={form.register("productionStatus")} options={options(PRODUCTION_STATUSES)} error={errors.productionStatus?.message} required />
          <TextInput label="Website" registration={form.register("website")} error={errors.website?.message} placeholder="https://example.com" />
          <TextInput label="Mine / project name" registration={form.register("mineOrProjectName")} error={errors.mineOrProjectName?.message} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <FormSection title="Primary contact" description="A named contact gives the qualification team a clear follow-up owner." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Name" registration={form.register("contactName")} error={errors.contactName?.message} required />
          <TextInput label="Job title" registration={form.register("contactJobTitle")} error={errors.contactJobTitle?.message} />
          <TextInput label="Email" registration={form.register("contactEmail")} error={errors.contactEmail?.message} type="email" />
          <TextInput label="Phone" registration={form.register("contactPhone")} error={errors.contactPhone?.message} type="tel" />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <FormSection title="Supply location" description="Export capability is recorded as a supplier statement and is not independently confirmed here." />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Loading country" registration={form.register("supplyCountry")} error={errors.supplyCountry?.message} required />
          <TextInput label="Loading location" registration={form.register("loadingLocation")} error={errors.loadingLocation?.message} required placeholder="Port, terminal, or inland location" />
          <CheckboxInput label="Supplier states export capability" registration={form.register("availableForExport")} hint="This does not establish that export documents have been verified." />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <FormSection title="Internal information" description="Keep sourcing context separate from supplier claims and verification decisions." />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Source / how discovered" registration={form.register("source")} error={errors.source?.message} required placeholder="Referral, event, inbound enquiry..." />
          <TextAreaInput label="Internal notes" registration={form.register("notes")} error={errors.notes?.message} />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/suppliers")}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>Create supplier</Button>
      </div>
    </form>
  );
}
