import { z } from "zod";

import {
  COMMODITIES,
  MINERAL_FORMS,
  PRODUCTION_STATUSES,
  PRODUCT_TYPES,
  SUPPLIER_TYPES,
  VERIFICATION_STATUSES,
} from "@/lib/domain";
import {
  ASSAY_SOURCES,
  COMMUNICATION_DIRECTIONS,
  COMMUNICATION_TYPES,
  FOLLOW_UP_PRIORITIES,
  INFORMATION_REQUEST_ITEMS,
  SUPPLIER_DOCUMENT_TYPES,
  SUPPLIER_OUTREACH_STATUSES,
  type InformationRequestItemId,
} from "@/lib/domain/supplier-workflow";

const optionalText = z.string().trim().optional();
const optionalNumber = z
  .string()
  .trim()
  .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), "Enter a valid non-negative number.")
  .transform((value) => (value === "" ? undefined : Number(value)));
const requiredPercent = z
  .string()
  .trim()
  .min(1, "This value is required.")
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100, "Enter a percentage from 0 to 100.")
  .transform(Number);
const optionalPercent = z
  .string()
  .trim()
  .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100), "Enter a percentage from 0 to 100.")
  .transform((value) => (value === "" ? undefined : Number(value)));
const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date.")
  .transform((value) => (value === "" ? undefined : value));

export const supplierOnboardingSchema = z.object({
  companyName: z.string().trim().min(2, "Enter the legal company name."),
  tradingName: optionalText,
  country: z.string().trim().min(2, "Select or enter the company country."),
  supplierType: z.enum(SUPPLIER_TYPES, { error: "Select a supplier type." }),
  website: z.string().trim().refine((value) => value === "" || /^https?:\/\/.+\..+/.test(value), "Enter a complete URL beginning with http:// or https://.").optional(),
  mineOrProjectName: optionalText,
  productionStatus: z.enum(PRODUCTION_STATUSES, { error: "Select a production status." }),
  contactName: z.string().trim().min(2, "Enter the primary contact's name."),
  contactJobTitle: optionalText,
  contactEmail: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address.").optional(),
  contactPhone: optionalText,
  supplyCountry: z.string().trim().min(2, "Enter the loading country."),
  loadingLocation: z.string().trim().min(2, "Enter a loading location."),
  availableForExport: z.boolean(),
  source: z.string().trim().min(2, "Record how this supplier was discovered."),
  notes: optionalText,
});

export const mineralProductSchema = z.object({
  commodity: z.enum(COMMODITIES, { error: "Select a commodity." }),
  productType: z.enum(PRODUCT_TYPES, { error: "Select a product type." }),
  mineralForm: z.enum(MINERAL_FORMS, { error: "Select a mineral form." }),
  gradePercent: requiredPercent,
  sulphurPercent: optionalPercent,
  availableQuantityMt: optionalNumber,
  monthlyCapacityMt: optionalNumber,
  trialQuantityMt: optionalNumber,
  loadingCountry: z.string().trim().min(2, "Enter the loading country."),
  loadingLocation: optionalText,
  particleSizeMm: optionalNumber,
  availableForExport: z.boolean(),
});

export const assaySchema = z.object({
  source: z.enum(ASSAY_SOURCES, { error: "Select an assay source." }),
  gradePercent: requiredPercent,
  sulphurPercent: optionalPercent,
  arsenicPercent: optionalPercent,
  chlorinePercent: optionalPercent,
  cadmiumPercent: optionalPercent,
  mercuryPercent: optionalPercent,
  fluorinePercent: optionalPercent,
  leadPercent: optionalPercent,
  zincPercent: optionalPercent,
  particleSizeMm: optionalNumber,
  laboratoryName: optionalText,
  certificateRef: optionalText,
  testedAt: optionalDate,
  notes: optionalText,
});

export const supplierDocumentSchema = z.object({
  type: z.enum(SUPPLIER_DOCUMENT_TYPES, { error: "Select a document type." }),
  name: z.string().trim().min(2, "Enter a document name."),
  reference: optionalText,
  issuedAt: optionalDate,
  expiresAt: optionalDate,
  status: z.enum(VERIFICATION_STATUSES),
  notes: optionalText,
});

export const communicationSchema = z.object({
  type: z.enum(COMMUNICATION_TYPES),
  direction: z.enum(COMMUNICATION_DIRECTIONS),
  contactId: optionalText,
  requirementId: optionalText,
  occurredAt: z.string().trim().min(1, "Enter the date and time of this interaction.").refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time."),
  subject: z.string().trim().min(3, "Enter the subject or purpose."),
  summary: z.string().trim().min(5, "Add a short summary of the interaction."),
  outcome: optionalText,
  nextAction: optionalText,
  followUpDate: optionalDate,
  followUpPriority: z.enum(FOLLOW_UP_PRIORITIES),
  followUpOwner: optionalText,
  internalNotes: optionalText,
}).superRefine((values, context) => {
  if (values.followUpDate && !values.nextAction?.trim()) {
    context.addIssue({ code: "custom", path: ["nextAction"], message: "Describe the follow-up action when scheduling a due date." });
  }
});

const informationItemIds = INFORMATION_REQUEST_ITEMS.map((item) => item.id) as [InformationRequestItemId, ...InformationRequestItemId[]];

export const informationRequestSchema = z.object({
  itemIds: z.array(z.enum(informationItemIds)).min(1, "Select at least one information item."),
  contactId: optionalText,
  dueAt: optionalDate,
  followUpPriority: z.enum(FOLLOW_UP_PRIORITIES),
  followUpOwner: optionalText,
  internalNote: optionalText,
  requirementId: optionalText,
});

export const outreachStatusSchema = z.enum(SUPPLIER_OUTREACH_STATUSES);

export type CommunicationInput = z.input<typeof communicationSchema>;
export type CommunicationValues = z.output<typeof communicationSchema>;
export type InformationRequestInput = z.input<typeof informationRequestSchema>;
export type InformationRequestValues = z.output<typeof informationRequestSchema>;

export type SupplierOnboardingInput = z.input<typeof supplierOnboardingSchema>;
export type SupplierOnboardingValues = z.output<typeof supplierOnboardingSchema>;
export type MineralProductInput = z.input<typeof mineralProductSchema>;
export type MineralProductValues = z.output<typeof mineralProductSchema>;
export type AssayInput = z.input<typeof assaySchema>;
export type AssayValues = z.output<typeof assaySchema>;
export type SupplierDocumentInput = z.input<typeof supplierDocumentSchema>;
export type SupplierDocumentValues = z.output<typeof supplierDocumentSchema>;
