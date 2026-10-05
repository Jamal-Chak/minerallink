"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { SelectInput, TextAreaInput, TextInput } from "@/components/supplier-workflow/form-controls";
import { addSupplierAssay } from "@/lib/data/supplier-workspace";
import { ASSAY_SOURCES } from "@/lib/domain/supplier-workflow";
import { assaySchema, type AssayInput, type AssayValues } from "@/lib/validation/supplier-schemas";

const options = ASSAY_SOURCES.map((value) => ({ value, label: value.replaceAll("_", " ") }));

export function AssayForm({ supplierId, productId }: { supplierId: string; productId: string }) {
  const form = useForm<AssayInput, unknown, AssayValues>({
    resolver: zodResolver(assaySchema),
    defaultValues: {
      source: "SUPPLIER", gradePercent: "", sulphurPercent: "", arsenicPercent: "", chlorinePercent: "",
      cadmiumPercent: "", mercuryPercent: "", fluorinePercent: "", leadPercent: "", zincPercent: "",
      particleSizeMm: "", laboratoryName: "", certificateRef: "", testedAt: "", notes: "",
    },
  });
  const errors = form.formState.errors;

  function onSubmit(values: AssayValues) {
    addSupplierAssay(supplierId, productId, values);
    form.reset();
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
        Record the stated source accurately. SUPPLIER values are supplier-reported; only an explicit independent source is represented as such, and entry does not itself verify a certificate.
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectInput label="Assay source" registration={form.register("source")} options={options} error={errors.source?.message} required />
        <TextInput label="Grade %" registration={form.register("gradePercent")} error={errors.gradePercent?.message} type="number" required />
        <TextInput label="Sulphur %" registration={form.register("sulphurPercent")} error={errors.sulphurPercent?.message} type="number" />
        <TextInput label="Arsenic %" registration={form.register("arsenicPercent")} error={errors.arsenicPercent?.message} type="number" />
        <TextInput label="Chlorine %" registration={form.register("chlorinePercent")} error={errors.chlorinePercent?.message} type="number" />
        <TextInput label="Cadmium %" registration={form.register("cadmiumPercent")} error={errors.cadmiumPercent?.message} type="number" />
        <TextInput label="Mercury %" registration={form.register("mercuryPercent")} error={errors.mercuryPercent?.message} type="number" />
        <TextInput label="Fluorine %" registration={form.register("fluorinePercent")} error={errors.fluorinePercent?.message} type="number" />
        <TextInput label="Lead %" registration={form.register("leadPercent")} error={errors.leadPercent?.message} type="number" />
        <TextInput label="Zinc %" registration={form.register("zincPercent")} error={errors.zincPercent?.message} type="number" />
        <TextInput label="Particle size mm" registration={form.register("particleSizeMm")} error={errors.particleSizeMm?.message} type="number" />
        <TextInput label="Laboratory" registration={form.register("laboratoryName")} error={errors.laboratoryName?.message} />
        <TextInput label="Certificate reference" registration={form.register("certificateRef")} error={errors.certificateRef?.message} />
        <TextInput label="Tested date" registration={form.register("testedAt")} error={errors.testedAt?.message} type="date" />
      </div>
      <TextAreaInput label="Assay notes" registration={form.register("notes")} error={errors.notes?.message} />
      <Button type="submit" disabled={form.formState.isSubmitting}>Record assay values</Button>
    </form>
  );
}
