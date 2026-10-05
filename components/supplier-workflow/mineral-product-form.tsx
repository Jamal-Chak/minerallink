"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { CheckboxInput, SelectInput, TextInput } from "@/components/supplier-workflow/form-controls";
import { addMineralProduct } from "@/lib/data/supplier-workspace";
import { COMMODITIES, MINERAL_FORMS, PRODUCT_TYPES } from "@/lib/domain";
import { mineralProductSchema, type MineralProductInput, type MineralProductValues } from "@/lib/validation/supplier-schemas";

const options = (values: readonly string[]) => values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
export function MineralProductForm({ supplierId, onSaved }: { supplierId: string; onSaved?: () => void }) {
  const form = useForm<MineralProductInput, unknown, MineralProductValues>({
    resolver: zodResolver(mineralProductSchema),
    defaultValues: {
      commodity: "COPPER", productType: "ORE", mineralForm: "UNKNOWN", gradePercent: "", sulphurPercent: "",
      availableQuantityMt: "", monthlyCapacityMt: "", trialQuantityMt: "", loadingCountry: "", loadingLocation: "",
      particleSizeMm: "", availableForExport: false,
    },
  });
  const errors = form.formState.errors;

  function onSubmit(values: MineralProductValues) {
    addMineralProduct(supplierId, values);
    form.reset();
    onSaved?.();
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950">
        Supplier-provided product information. Grade and specifications here are not independently verified assay data.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput label="Commodity" registration={form.register("commodity")} options={options(COMMODITIES)} error={errors.commodity?.message} required />
        <SelectInput label="Product type" registration={form.register("productType")} options={options(PRODUCT_TYPES)} error={errors.productType?.message} required />
        <SelectInput label="Mineral form" registration={form.register("mineralForm")} options={options(MINERAL_FORMS)} error={errors.mineralForm?.message} required />
        <TextInput label="Grade %" registration={form.register("gradePercent")} error={errors.gradePercent?.message} type="number" required />
        <TextInput label="Sulphur %" registration={form.register("sulphurPercent")} error={errors.sulphurPercent?.message} type="number" />
        <TextInput label="Available quantity MT" registration={form.register("availableQuantityMt")} error={errors.availableQuantityMt?.message} type="number" />
        <TextInput label="Monthly capacity MT" registration={form.register("monthlyCapacityMt")} error={errors.monthlyCapacityMt?.message} type="number" />
        <TextInput label="Trial quantity MT" registration={form.register("trialQuantityMt")} error={errors.trialQuantityMt?.message} type="number" />
        <TextInput label="Loading country" registration={form.register("loadingCountry")} error={errors.loadingCountry?.message} required />
        <TextInput label="Loading location" registration={form.register("loadingLocation")} error={errors.loadingLocation?.message} />
        <TextInput label="Particle size mm" registration={form.register("particleSizeMm")} error={errors.particleSizeMm?.message} type="number" />
        <CheckboxInput label="Available for export" registration={form.register("availableForExport")} hint="Supplier-stated capability only." />
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>Add product</Button>
    </form>
  );
}
