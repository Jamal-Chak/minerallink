"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { FormSection, SelectInput, TextAreaInput, TextInput } from "@/components/supplier-workflow/form-controls";
import { Button } from "@/components/ui/button";
import { useSupplierWorkspace } from "@/lib/data/use-supplier-workspace";
import { createDeal } from "@/lib/data/supplier-workspace";
import { buyerRequirements } from "@/lib/data/demo-data";
import { DEAL_SUPPLY_TYPES } from "@/lib/domain/deal-workflow";
import { matchMineralProduct, productWithAssay } from "@/lib/matching";
import { dealCreateSchema, type DealCreateInput, type DealCreateValues } from "@/lib/validation/deal-schemas";

const options = (values: readonly string[]) => values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
const emptyProducts: [] = [];
const activeRequirements = buyerRequirements.filter((requirement) => requirement.active);
const buyerAccounts = [...new Set(buyerRequirements.filter((requirement) => requirement.active).map((requirement) => requirement.buyerId))]
  .map((id) => ({ value: id, label: `Buyer account ${id} · synthetic demo account` }));

export function DealCreateForm({
  initialSupplierId = "",
  initialProductId = "",
  initialRequirementId = "",
  createdFromMatch = false,
}: {
  initialSupplierId?: string;
  initialProductId?: string;
  initialRequirementId?: string;
  createdFromMatch?: boolean;
}) {
  const router = useRouter();
  const { workspace } = useSupplierWorkspace();
  const firstRequirement = activeRequirements.find((requirement) => requirement.id === initialRequirementId) ?? activeRequirements[0];
  const initialSupplier = workspace.suppliers.find((supplier) => supplier.id === initialSupplierId);
  const form = useForm<DealCreateInput, unknown, DealCreateValues>({
    resolver: zodResolver(dealCreateSchema),
    defaultValues: {
      buyerId: firstRequirement?.buyerId ?? "",
      requirementId: firstRequirement?.id ?? "",
      supplierId: initialSupplier?.id ?? "",
      productId: initialProductId || (workspace.products[initialSupplier?.id ?? ""]?.[0]?.id ?? ""),
      supplyType: "TRIAL",
      quantityMt: "",
      currency: "",
      pricePerMt: "",
      incoterm: "",
      destination: firstRequirement?.destinationCountry ?? "",
      notes: "",
    },
  });
  const requirementId = useWatch({ control: form.control, name: "requirementId" });
  const supplierId = useWatch({ control: form.control, name: "supplierId" });
  const supplier = workspace.suppliers.find((item) => item.id === supplierId);
  const products = workspace.products[supplierId] ?? emptyProducts;
  const errors = form.formState.errors;

  useEffect(() => {
    const requirement = activeRequirements.find((item) => item.id === requirementId);
    if (requirement) {
      form.setValue("buyerId", requirement.buyerId, { shouldValidate: true });
      if (!form.getValues("destination")) form.setValue("destination", requirement.destinationCountry);
    }
  }, [form, requirementId]);

  useEffect(() => {
    const productId = form.getValues("productId");
    if (productId && !products.some((product) => product.id === productId)) {
      form.setValue("productId", products[0]?.id ?? "", { shouldValidate: true });
    }
  }, [form, products, supplierId]);

  function submit(values: DealCreateValues) {
    const selectedSupplier = workspace.suppliers.find((item) => item.id === values.supplierId);
    const product = workspace.products[values.supplierId]?.find((item) => item.id === values.productId);
    const requirement = buyerRequirements.find((item) => item.id === values.requirementId);
    const assay = workspace.assays[values.supplierId]?.filter((item) => item.productId === values.productId).at(-1);
    const needsReview = selectedSupplier && (selectedSupplier.verificationStatus !== "VERIFIED" || selectedSupplier.pipelineStatus !== "QUALIFIED");
    if (needsReview && !window.confirm("Supplier qualification is incomplete. Review verification before commercial progression. Create this deal anyway?")) return;
    const matchResult = createdFromMatch && product && requirement ? matchMineralProduct(productWithAssay(product, assay), requirement) : undefined;
    const matchEvidenceSource = assay ? `${assay.source} assay` : "Supplier-provided product specification";
    const dealId = createDeal({ ...values, createdFromMatch, matchResult, matchEvidenceSource: createdFromMatch ? matchEvidenceSource : undefined });
    router.push(`/deals/${dealId}`);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-5">
      {createdFromMatch && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">Prefilled from a buyer-match result. Match is technical screening only; it does not verify supplier evidence or create a deal automatically.</div>}
      {supplier && (supplier.verificationStatus !== "VERIFIED" || supplier.pipelineStatus !== "QUALIFIED") && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><strong>Supplier qualification is incomplete.</strong> Review verification before commercial progression. You will be asked to confirm before continuing.</div>}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <FormSection title="Deal parties and requirement" description="Select the parties and active requirement this commercial opportunity is being evaluated against." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SelectInput label="Buyer account" registration={form.register("buyerId")} options={[{ value: "", label: "Select buyer account" }, ...buyerAccounts]} error={errors.buyerId?.message} required />
          <SelectInput label="Buyer requirement" registration={form.register("requirementId")} options={activeRequirements.map((requirement) => ({ value: requirement.id, label: requirement.title }))} error={errors.requirementId?.message} required />
          <SelectInput label="Supplier" registration={form.register("supplierId")} options={[{ value: "", label: "Select supplier" }, ...workspace.suppliers.map((item) => ({ value: item.id, label: `${item.companyName}${workspace.metadata[item.id]?.isDemoFixture ? " · synthetic" : ""}` }))]} error={errors.supplierId?.message} required />
          <SelectInput label="Mineral product" registration={form.register("productId")} options={[{ value: "", label: "Select product" }, ...products.map((product) => ({ value: product.id, label: `${product.name} · ${product.specification.commodity} ${product.specification.gradePercent}% (supplier-reported)` }))]} error={errors.productId?.message} required />
          <SelectInput label="Supply type" registration={form.register("supplyType")} options={options(DEAL_SUPPLY_TYPES)} error={errors.supplyType?.message} required />
          <TextInput label="Quantity MT" registration={form.register("quantityMt")} error={errors.quantityMt?.message} type="number" />
          <TextInput label="Indicative price per MT" registration={form.register("pricePerMt")} error={errors.pricePerMt?.message} type="number" hint="Leave blank until a price is provided." />
          <TextInput label="Currency" registration={form.register("currency")} error={errors.currency?.message} placeholder="Unknown" />
          <SelectInput label="Indicative Incoterm" registration={form.register("incoterm")} options={[{ value: "", label: "Unknown" }, { value: "FOB", label: "FOB" }, { value: "CIF", label: "CIF" }]} error={errors.incoterm?.message} />
          <TextInput label="Destination" registration={form.register("destination")} error={errors.destination?.message} placeholder="Destination country or port" />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <FormSection title="Internal notes" description="A deal record is an explicit commercial workspace, not evidence of an offer, introduction, or transaction." />
        <TextAreaInput label="Internal notes" registration={form.register("notes")} error={errors.notes?.message} rows={4} />
      </section>

      <div className="flex justify-end"><Button type="submit" disabled={form.formState.isSubmitting}>Create deal</Button></div>
    </form>
  );
}
