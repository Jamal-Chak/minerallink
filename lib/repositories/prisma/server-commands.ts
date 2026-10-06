// Phase 7 — server command validation (Zod, server-side).
//
// Reuses existing form-input schemas where they already encode the rule, and
// adds strict server command schemas: malformed ids, invalid enums, bad
// timestamps, invalid/negative money, and missing required reasons are all
// rejected before the repository runs. TypeScript alone is not trusted.
import { z } from "zod";
import { DEAL_STATUSES } from "@/lib/domain/deal";
import { PRODUCTION_STATUSES, SUPPLIER_PIPELINE_STATUSES, SUPPLIER_TYPES, VERIFICATION_STATUSES } from "@/lib/domain";
import {
  COMMISSION_STATUSES,
  COMMISSION_TYPES,
  PAYMENT_MILESTONE_STATUSES,
  SHIPMENT_STATUSES,
} from "@/lib/domain/deal-workflow";
import {
  FOLLOW_UP_PRIORITIES,
  SUPPLIER_OUTREACH_STATUSES,
} from "@/lib/domain/supplier-workflow";

export const serverId = z.string().min(1).max(300);
export const serverTimestamp = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "must be an ISO-8601 timestamp",
});
const nonNegative = z.number().finite().nonnegative();
const optionalMoney = nonNegative.optional();

export const serverSupplierCreateSchema = z.object({
  id: serverId.optional(),
  companyName: z.string().trim().min(2),
  tradingName: z.string().trim().optional(),
  country: z.string().trim().min(2),
  supplierType: z.enum(SUPPLIER_TYPES),
  productionStatus: z.enum(PRODUCTION_STATUSES).default("UNKNOWN"),
  contactName: z.string().trim().min(2),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  source: z.string().trim().min(2),
  supplyCountry: z.string().trim().min(2),
  loadingLocation: z.string().trim().optional(),
  availableForExport: z.boolean().default(false),
  notes: z.string().trim().optional(),
});

export const serverSupplierProfileSchema = z.object({
  supplierId: serverId,
  tradingName: z.string().trim().optional(),
  mineOrProjectName: z.string().trim().optional(),
  website: z.string().trim().optional(),
  productionStatus: z.enum(PRODUCTION_STATUSES).optional(),
  notes: z.string().trim().optional(),
  expectedUpdatedAt: serverTimestamp.optional(),
});

export const serverVerificationSchema = z.object({
  supplierId: serverId,
  status: z.enum(VERIFICATION_STATUSES),
  reason: z.string().trim().min(5, "An internal reason of at least 5 characters is required."),
  expectedUpdatedAt: serverTimestamp.optional(),
});

export const serverPipelineSchema = z.object({
  supplierId: serverId,
  status: z.enum(SUPPLIER_PIPELINE_STATUSES),
  expectedUpdatedAt: serverTimestamp.optional(),
});

export const serverOutreachSchema = z.object({
  supplierId: serverId,
  status: z.enum(SUPPLIER_OUTREACH_STATUSES),
});

export const serverCommunicationSchema = z.object({
  supplierId: serverId,
  type: z.enum(["EMAIL", "PHONE", "WHATSAPP", "MEETING", "OTHER"]),
  direction: z.enum(["OUTBOUND", "INBOUND"]),
  occurredAt: serverTimestamp,
  subject: z.string().trim().min(3),
  summary: z.string().trim().min(5),
  outcome: z.string().trim().optional(),
  nextAction: z.string().trim().optional(),
});

export const serverFollowUpSchema = z.object({
  supplierId: serverId,
  dueAt: serverTimestamp,
  priority: z.enum(FOLLOW_UP_PRIORITIES),
  owner: z.string().trim().min(1),
  action: z.string().trim().min(3),
  contactId: serverId.optional(),
});

export const serverDealCreateSchema = z.object({
  id: serverId.optional(),
  buyerId: serverId,
  supplierId: serverId,
  requirementId: serverId,
  productId: serverId,
  supplyType: z.enum(["TRIAL", "RECURRING"]),
  quantityMt: optionalMoney,
  currency: z.string().trim().optional(),
  pricePerMt: optionalMoney,
  notes: z.string().trim().optional(),
});

export const serverDealStageSchema = z.object({
  dealId: serverId,
  status: z.enum(DEAL_STATUSES),
  expectedUpdatedAt: serverTimestamp.optional(),
});

export const serverShipmentSchema = z.object({
  dealId: serverId,
  plannedQuantityMt: optionalMoney,
  actualQuantityMt: optionalMoney,
  loadingLocation: z.string().trim().optional(),
  destinationPort: z.string().trim().optional(),
  status: z.enum(SHIPMENT_STATUSES),
  billOfLadingReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const serverPaymentSchema = z.object({
  dealId: serverId,
  milestone: z.string().trim().min(2),
  expectedPercentage: z.number().finite().min(0).max(100).optional(),
  expectedAmount: optionalMoney,
  currency: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  status: z.enum(PAYMENT_MILESTONE_STATUSES),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const serverCommissionSchema = z.object({
  dealId: serverId,
  type: z.enum(COMMISSION_TYPES),
  percentage: z.number().finite().min(0).max(100).optional(),
  fixedAmount: optionalMoney,
  currency: z.string().trim().optional(),
  status: z.enum(COMMISSION_STATUSES),
});

export type ServerCommand =
  | { kind: "supplier.create"; input: z.output<typeof serverSupplierCreateSchema> }
  | { kind: "supplier.updateProfile"; input: z.output<typeof serverSupplierProfileSchema> };
