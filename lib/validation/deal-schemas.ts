import { z } from "zod";

import { DEAL_STATUSES } from "@/lib/domain/deal";
import {
  COMMERCIAL_VALUE_STATES,
  COMMISSION_STATUSES,
  COMMISSION_TYPES,
  DEAL_SUPPLY_TYPES,
  INSPECTION_AGENCIES,
  INSPECTION_POINTS,
  INSPECTION_STATUSES,
  NEGOTIATION_PARTIES,
  PAYMENT_MILESTONE_STATUSES,
  SHIPMENT_STATUSES,
} from "@/lib/domain/deal-workflow";

const optionalText = z.string().trim().transform((value) => value || undefined);
const optionalNumber = z.string().trim()
  .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), "Enter a valid non-negative amount.")
  .transform((value) => value === "" ? undefined : Number(value));
const optionalPercent = z.string().trim()
  .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100), "Enter a percentage from 0 to 100.")
  .transform((value) => value === "" ? undefined : Number(value));
const optionalDate = z.string().trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date.")
  .transform((value) => value || undefined);
const incoterm = z.union([z.literal(""), z.enum(["FOB", "CIF"])]).transform((value) => value || undefined);
const paymentMethod = z.union([z.literal(""), z.enum(["TT", "DLC"])]).transform((value) => value || undefined);

export const dealCreateSchema = z.object({
  buyerId: z.string().min(1, "Select a buyer account."),
  requirementId: z.string().min(1, "Select a buyer requirement."),
  supplierId: z.string().min(1, "Select a supplier."),
  productId: z.string().min(1, "Select a mineral product."),
  supplyType: z.enum(DEAL_SUPPLY_TYPES),
  quantityMt: optionalNumber,
  currency: optionalText,
  pricePerMt: optionalNumber,
  incoterm,
  destination: optionalText,
  notes: optionalText,
});

export const commercialTermsSchema = z.object({
  quantityMt: optionalNumber,
  pricePerMt: optionalNumber,
  currency: optionalText,
  incoterm,
  loadingLocation: optionalText,
  destinationPort: optionalText,
  inspectionAgency: z.union([z.literal(""), z.enum(INSPECTION_AGENCIES)]).transform((value) => value || undefined),
  paymentMethod,
  paymentTerms: optionalText,
  offerValidity: optionalDate,
  deliverySchedule: optionalText,
  packing: optionalText,
  particleSizeMm: optionalNumber,
  commercialNotes: optionalText,
  valueState: z.enum(COMMERCIAL_VALUE_STATES),
});

export const buyerIntroductionSchema = z.object({
  introducedAt: z.string().trim().min(1, "Record the introduction date.").refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date."),
  supplierContactId: optionalText,
  buyerContactName: optionalText,
  buyerContactEmail: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address.").transform((value) => value || undefined),
  requirementId: z.string().min(1, "Select the requirement used for this introduction."),
  introducedBy: z.string().trim().min(2, "Enter who made the introduction."),
  internalNotes: optionalText,
});

export const negotiationRoundSchema = z.object({
  date: z.string().trim().min(1, "Enter the negotiation date.").refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date."),
  party: z.enum(NEGOTIATION_PARTIES),
  quantityMt: optionalNumber,
  pricePerMt: optionalNumber,
  currency: optionalText,
  incoterm,
  paymentMethod,
  paymentTerms: optionalText,
  destination: optionalText,
  comments: optionalText,
});

export const shipmentSchema = z.object({
  plannedQuantityMt: optionalNumber,
  actualQuantityMt: optionalNumber,
  loadingLocation: optionalText,
  destinationPort: optionalText,
  etd: optionalDate,
  eta: optionalDate,
  packing: optionalText,
  inspectionCompany: z.union([z.literal(""), z.enum(INSPECTION_AGENCIES)]).transform((value) => value || undefined),
  inspectionReference: optionalText,
  billOfLadingReference: optionalText,
  status: z.enum(SHIPMENT_STATUSES),
  notes: optionalText,
});

export const inspectionSchema = z.object({
  point: z.enum(INSPECTION_POINTS),
  agency: z.enum(INSPECTION_AGENCIES),
  reference: optionalText,
  date: optionalDate,
  status: z.enum(INSPECTION_STATUSES),
  resultNotes: optionalText,
});

export const paymentMilestoneSchema = z.object({
  milestone: z.string().trim().min(2, "Enter the payment milestone."),
  expectedPercentage: optionalPercent,
  expectedAmount: optionalNumber,
  currency: optionalText,
  dueDate: optionalDate,
  status: z.enum(PAYMENT_MILESTONE_STATUSES),
  reference: optionalText,
  notes: optionalText,
});

export const commissionSchema = z.object({
  type: z.enum(COMMISSION_TYPES),
  percentage: optionalPercent,
  fixedAmount: optionalNumber,
  currency: optionalText,
  status: z.enum(COMMISSION_STATUSES),
}).superRefine((values, context) => {
  if (values.type === "PERCENTAGE" && values.percentage === undefined) {
    context.addIssue({ code: "custom", path: ["percentage"], message: "Enter the agreed or proposed commission percentage." });
  }
  if (values.type === "FIXED" && values.fixedAmount === undefined) {
    context.addIssue({ code: "custom", path: ["fixedAmount"], message: "Enter the fixed commission amount." });
  }
});

export const dealStageSchema = z.enum(DEAL_STATUSES);

export type DealCreateInput = z.input<typeof dealCreateSchema>;
export type DealCreateValues = z.output<typeof dealCreateSchema>;
export type CommercialTermsInput = z.input<typeof commercialTermsSchema>;
export type CommercialTermsValues = z.output<typeof commercialTermsSchema>;
export type BuyerIntroductionInput = z.input<typeof buyerIntroductionSchema>;
export type BuyerIntroductionValues = z.output<typeof buyerIntroductionSchema>;
export type NegotiationRoundInput = z.input<typeof negotiationRoundSchema>;
export type NegotiationRoundValues = z.output<typeof negotiationRoundSchema>;
export type ShipmentInput = z.input<typeof shipmentSchema>;
export type ShipmentValues = z.output<typeof shipmentSchema>;
export type InspectionInput = z.input<typeof inspectionSchema>;
export type InspectionValues = z.output<typeof inspectionSchema>;
export type PaymentMilestoneInput = z.input<typeof paymentMilestoneSchema>;
export type PaymentMilestoneValues = z.output<typeof paymentMilestoneSchema>;
export type CommissionInput = z.input<typeof commissionSchema>;
export type CommissionValues = z.output<typeof commissionSchema>;
