"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormSection, SelectInput, TextAreaInput, TextInput } from "@/components/supplier-workflow/form-controls";
import {
  addDealInspection,
  addDealNegotiationRound,
  addDealPaymentMilestone,
  createDealShipment,
  recordBuyerIntroduction,
  saveDealCommercialTerms,
  saveDealCommission,
} from "@/lib/data/supplier-workspace";
import {
  COMMERCIAL_VALUE_STATES,
  COMMISSION_STATUSES,
  COMMISSION_TYPES,
  INSPECTION_AGENCIES,
  INSPECTION_POINTS,
  INSPECTION_STATUSES,
  NEGOTIATION_PARTIES,
  PAYMENT_MILESTONE_STATUSES,
  SHIPMENT_STATUSES,
  type DealCommercialTerms,
  type DealCommission,
} from "@/lib/domain/deal-workflow";
import type {
  BuyerIntroductionInput,
  BuyerIntroductionValues,
  CommercialTermsInput,
  CommercialTermsValues,
  CommissionInput,
  CommissionValues,
  InspectionInput,
  InspectionValues,
  NegotiationRoundInput,
  NegotiationRoundValues,
  PaymentMilestoneInput,
  PaymentMilestoneValues,
  ShipmentInput,
  ShipmentValues,
} from "@/lib/validation/deal-schemas";
import {
  buyerIntroductionSchema,
  commercialTermsSchema,
  commissionSchema,
  inspectionSchema,
  negotiationRoundSchema,
  paymentMilestoneSchema,
  shipmentSchema,
} from "@/lib/validation/deal-schemas";

const labels = (values: readonly string[]) => values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
const optional = (value?: string | number) => value === undefined ? "" : String(value);

export function CommercialTermsForm({ dealId, current }: { dealId: string; current?: DealCommercialTerms }) {
  const form = useForm<CommercialTermsInput, unknown, CommercialTermsValues>({
    resolver: zodResolver(commercialTermsSchema),
    defaultValues: {
      quantityMt: optional(current?.quantityMt), pricePerMt: optional(current?.pricePerMt), currency: current?.currency ?? "",
      incoterm: current?.incoterm ?? "", loadingLocation: current?.loadingLocation ?? "", destinationPort: current?.destinationPort ?? "",
      inspectionAgency: current?.inspectionAgency ?? "", paymentMethod: current?.paymentMethod ?? "", paymentTerms: current?.paymentTerms ?? "",
      offerValidity: current?.offerValidity?.slice(0, 10) ?? "", deliverySchedule: current?.deliverySchedule ?? "", packing: current?.packing ?? "",
      particleSizeMm: optional(current?.particleSizeMm), commercialNotes: current?.commercialNotes ?? "", valueState: current?.valueState ?? "INDICATIVE",
    },
  });
  const errors = form.formState.errors;
  function submit(values: CommercialTermsValues) { saveDealCommercialTerms(dealId, values); }
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <FormSection title="Commercial offer terms" description="Unknown fields stay blank. Mark values INDICATIVE, AGREED, or ACTUAL; a saved offer is not a contract." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <TextInput label="Quantity MT" registration={form.register("quantityMt")} error={errors.quantityMt?.message} type="number" />
      <TextInput label="Price per MT" registration={form.register("pricePerMt")} error={errors.pricePerMt?.message} type="number" />
      <TextInput label="Currency" registration={form.register("currency")} error={errors.currency?.message} placeholder="Unknown" />
      <SelectInput label="Value state" registration={form.register("valueState")} options={labels(COMMERCIAL_VALUE_STATES)} error={errors.valueState?.message} />
      <SelectInput label="Incoterm" registration={form.register("incoterm")} options={[{ value: "", label: "Unknown" }, { value: "FOB", label: "FOB" }, { value: "CIF", label: "CIF" }]} error={errors.incoterm?.message} />
      <TextInput label="Loading location" registration={form.register("loadingLocation")} error={errors.loadingLocation?.message} />
      <TextInput label="Destination port" registration={form.register("destinationPort")} error={errors.destinationPort?.message} />
      <SelectInput label="Inspection agency" registration={form.register("inspectionAgency")} options={[{ value: "", label: "Unknown" }, ...labels(INSPECTION_AGENCIES)]} error={errors.inspectionAgency?.message} />
      <SelectInput label="Payment method" registration={form.register("paymentMethod")} options={[{ value: "", label: "Unknown" }, { value: "TT", label: "T/T" }, { value: "DLC", label: "DLC" }]} error={errors.paymentMethod?.message} />
      <TextInput label="Payment terms" registration={form.register("paymentTerms")} error={errors.paymentTerms?.message} />
      <TextInput label="Offer validity" registration={form.register("offerValidity")} error={errors.offerValidity?.message} type="date" />
      <TextInput label="Delivery schedule" registration={form.register("deliverySchedule")} error={errors.deliverySchedule?.message} />
      <TextInput label="Packing" registration={form.register("packing")} error={errors.packing?.message} />
      <TextInput label="Particle size mm" registration={form.register("particleSizeMm")} error={errors.particleSizeMm?.message} type="number" />
    </div>
    <TextAreaInput label="Commercial notes" registration={form.register("commercialNotes")} error={errors.commercialNotes?.message} rows={3} />
    <Button type="submit">Save commercial terms</Button>
  </form>;
}

export function BuyerIntroductionForm({ dealId, requirementId, supplierContacts }: { dealId: string; requirementId: string; supplierContacts: { id: string; name: string }[] }) {
  const form = useForm<BuyerIntroductionInput, unknown, BuyerIntroductionValues>({
    resolver: zodResolver(buyerIntroductionSchema),
    defaultValues: { introducedAt: new Date().toISOString().slice(0, 16), supplierContactId: supplierContacts[0]?.id ?? "", buyerContactName: "", buyerContactEmail: "", requirementId, introducedBy: "", internalNotes: "" },
  });
  const errors = form.formState.errors;
  function submit(values: BuyerIntroductionValues) { recordBuyerIntroduction(dealId, { ...values, introducedAt: new Date(values.introducedAt).toISOString() }); }
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <FormSection title="Record buyer introduction" description="This milestone is only recorded after a user explicitly enters that an introduction occurred." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <TextInput label="Introduction date" registration={form.register("introducedAt")} error={errors.introducedAt?.message} type="datetime-local" required />
      <SelectInput label="Supplier contact" registration={form.register("supplierContactId")} options={[{ value: "", label: "Not selected" }, ...supplierContacts.map((contact) => ({ value: contact.id, label: contact.name }))]} error={errors.supplierContactId?.message} />
      <TextInput label="Buyer contact name" registration={form.register("buyerContactName")} error={errors.buyerContactName?.message} />
      <TextInput label="Buyer contact email" registration={form.register("buyerContactEmail")} error={errors.buyerContactEmail?.message} type="email" />
      <TextInput label="Introduced by" registration={form.register("introducedBy")} error={errors.introducedBy?.message} required />
    </div>
    <input type="hidden" {...form.register("requirementId")} />
    <TextAreaInput label="Internal notes" registration={form.register("internalNotes")} error={errors.internalNotes?.message} />
    <Button type="submit">Record introduction</Button>
  </form>;
}

export function NegotiationRoundForm({ dealId, destination }: { dealId: string; destination?: string }) {
  const form = useForm<NegotiationRoundInput, unknown, NegotiationRoundValues>({
    resolver: zodResolver(negotiationRoundSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), party: "SUPPLIER", quantityMt: "", pricePerMt: "", currency: "", incoterm: "", paymentMethod: "", paymentTerms: "", destination: destination ?? "", comments: "" },
  });
  const errors = form.formState.errors;
  function submit(values: NegotiationRoundValues) { addDealNegotiationRound(dealId, values); form.reset({ ...values, date: new Date().toISOString().slice(0, 10), quantityMt: "", pricePerMt: "", comments: "" }); }
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <FormSection title="Add negotiation round" description="Each offer or counteroffer is appended to history; previous rounds are never overwritten." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <TextInput label="Date" registration={form.register("date")} error={errors.date?.message} type="date" required />
      <SelectInput label="Party / source" registration={form.register("party")} options={labels(NEGOTIATION_PARTIES)} error={errors.party?.message} />
      <TextInput label="Quantity MT" registration={form.register("quantityMt")} error={errors.quantityMt?.message} type="number" />
      <TextInput label="Price per MT" registration={form.register("pricePerMt")} error={errors.pricePerMt?.message} type="number" />
      <TextInput label="Currency" registration={form.register("currency")} error={errors.currency?.message} />
      <SelectInput label="Incoterm" registration={form.register("incoterm")} options={[{ value: "", label: "Unknown" }, { value: "FOB", label: "FOB" }, { value: "CIF", label: "CIF" }]} error={errors.incoterm?.message} />
      <SelectInput label="Payment method" registration={form.register("paymentMethod")} options={[{ value: "", label: "Unknown" }, { value: "TT", label: "T/T" }, { value: "DLC", label: "DLC" }]} error={errors.paymentMethod?.message} />
      <TextInput label="Payment terms" registration={form.register("paymentTerms")} error={errors.paymentTerms?.message} />
      <TextInput label="Destination" registration={form.register("destination")} error={errors.destination?.message} />
    </div>
    <TextAreaInput label="Comments" registration={form.register("comments")} error={errors.comments?.message} />
    <Button type="submit">Add negotiation round</Button>
  </form>;
}

export function ShipmentForm({ dealId }: { dealId: string }) {
  const form = useForm<ShipmentInput, unknown, ShipmentValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: { plannedQuantityMt: "", actualQuantityMt: "", loadingLocation: "", destinationPort: "", etd: "", eta: "", packing: "", inspectionCompany: "", inspectionReference: "", billOfLadingReference: "", status: "PLANNED", notes: "" },
  });
  const errors = form.formState.errors;
  function submit(values: ShipmentValues) { createDealShipment(dealId, values); }
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <FormSection title="Create trial shipment record" description="A shipment appears only after this explicit entry. Development records are not logistics bookings." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <TextInput label="Planned quantity MT" registration={form.register("plannedQuantityMt")} error={errors.plannedQuantityMt?.message} type="number" />
      <TextInput label="Actual quantity MT" registration={form.register("actualQuantityMt")} error={errors.actualQuantityMt?.message} type="number" />
      <TextInput label="Loading location" registration={form.register("loadingLocation")} error={errors.loadingLocation?.message} />
      <TextInput label="Destination port" registration={form.register("destinationPort")} error={errors.destinationPort?.message} />
      <TextInput label="ETD" registration={form.register("etd")} error={errors.etd?.message} type="date" />
      <TextInput label="ETA" registration={form.register("eta")} error={errors.eta?.message} type="date" />
      <TextInput label="Packing" registration={form.register("packing")} error={errors.packing?.message} />
      <SelectInput label="Inspection company" registration={form.register("inspectionCompany")} options={[{ value: "", label: "Unknown" }, ...labels(INSPECTION_AGENCIES)]} error={errors.inspectionCompany?.message} />
      <TextInput label="Inspection reference" registration={form.register("inspectionReference")} error={errors.inspectionReference?.message} />
      <TextInput label="Bill of Lading reference" registration={form.register("billOfLadingReference")} error={errors.billOfLadingReference?.message} />
      <SelectInput label="Shipment status" registration={form.register("status")} options={labels(SHIPMENT_STATUSES)} error={errors.status?.message} />
    </div>
    <TextAreaInput label="Shipment notes" registration={form.register("notes")} error={errors.notes?.message} />
    <Button type="submit">Create shipment record</Button>
  </form>;
}

export function InspectionForm({ dealId, shipmentId }: { dealId: string; shipmentId?: string }) {
  const form = useForm<InspectionInput, unknown, InspectionValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: { point: "LOADING_PORT", agency: "SGS", reference: "", date: "", status: "PLANNED", resultNotes: "" },
  });
  const errors = form.formState.errors;
  function submit(values: InspectionValues) { addDealInspection(dealId, { ...values, shipmentId, date: values.date ? new Date(values.date).toISOString() : undefined }); }
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <SelectInput label="Inspection point" registration={form.register("point")} options={labels(INSPECTION_POINTS)} error={errors.point?.message} />
      <SelectInput label="Agency" registration={form.register("agency")} options={labels(INSPECTION_AGENCIES)} error={errors.agency?.message} />
      <TextInput label="Reference" registration={form.register("reference")} error={errors.reference?.message} />
      <TextInput label="Date" registration={form.register("date")} error={errors.date?.message} type="date" />
      <SelectInput label="Status" registration={form.register("status")} options={labels(INSPECTION_STATUSES)} error={errors.status?.message} />
    </div>
    <TextAreaInput label="Result / notes" registration={form.register("resultNotes")} error={errors.resultNotes?.message} rows={2} />
    <Button type="submit">Add inspection milestone</Button>
  </form>;
}

export function PaymentMilestoneForm({ dealId, currency }: { dealId: string; currency?: string }) {
  const form = useForm<PaymentMilestoneInput, unknown, PaymentMilestoneValues>({
    resolver: zodResolver(paymentMilestoneSchema),
    defaultValues: { milestone: "70% provisional payment", expectedPercentage: "70", expectedAmount: "", currency: currency ?? "", dueDate: "", status: "NOT_DUE", reference: "", notes: "" },
  });
  const errors = form.formState.errors;
  function submit(values: PaymentMilestoneValues) { addDealPaymentMilestone(dealId, values); }
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <TextInput label="Milestone" registration={form.register("milestone")} error={errors.milestone?.message} required />
      <TextInput label="Expected %" registration={form.register("expectedPercentage")} error={errors.expectedPercentage?.message} type="number" />
      <TextInput label="Expected amount" registration={form.register("expectedAmount")} error={errors.expectedAmount?.message} type="number" />
      <TextInput label="Currency" registration={form.register("currency")} error={errors.currency?.message} />
      <TextInput label="Due date" registration={form.register("dueDate")} error={errors.dueDate?.message} type="date" />
      <SelectInput label="Status" registration={form.register("status")} options={labels(PAYMENT_MILESTONE_STATUSES)} error={errors.status?.message} />
      <TextInput label="Reference" registration={form.register("reference")} error={errors.reference?.message} />
    </div>
    <TextAreaInput label="Notes" registration={form.register("notes")} error={errors.notes?.message} rows={2} />
    <Button type="submit">Add payment milestone</Button>
  </form>;
}

export function CommissionForm({ dealId, current }: { dealId: string; current?: DealCommission }) {
  const form = useForm<CommissionInput, unknown, CommissionValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: { type: current?.type ?? "PERCENTAGE", percentage: optional(current?.percentage), fixedAmount: optional(current?.fixedAmount), currency: current?.currency ?? "", status: current?.status ?? "NOT_AGREED" },
  });
  const errors = form.formState.errors;
  function submit(values: CommissionValues) { saveDealCommission(dealId, values); }
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <SelectInput label="Commission type" registration={form.register("type")} options={labels(COMMISSION_TYPES)} error={errors.type?.message} />
      <SelectInput label="Commission status" registration={form.register("status")} options={labels(COMMISSION_STATUSES)} error={errors.status?.message} />
      <TextInput label="Commission percentage" registration={form.register("percentage")} error={errors.percentage?.message} type="number" />
      <TextInput label="Fixed amount" registration={form.register("fixedAmount")} error={errors.fixedAmount?.message} type="number" />
      <TextInput label="Commission currency" registration={form.register("currency")} error={errors.currency?.message} />
    </div>
    <p className="text-xs text-amber-800">Estimated commission is not revenue. It is not earned, invoiced, or paid unless its status is explicitly recorded.</p>
    <Button type="submit">Save commission terms</Button>
  </form>;
}
