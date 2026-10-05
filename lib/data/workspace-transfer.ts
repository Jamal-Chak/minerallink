// Workspace export / import with versioned payload validation.
//
// - exportWorkspace() snapshots the active repository into a versioned envelope.
// - validateWorkspaceImport() structurally validates any accepted payload
//   (envelope + core records) WITHOUT touching storage, so it is safe for UI
//   preflight checks.
// - importWorkspace() applies a validated payload with an EXPLICIT strategy:
//     "replace" — the payload becomes the new workspace;
//     "merge"   — additive union by id; current records always win on id
//                 conflicts and nothing current is ever deleted.
//
// Ids, timestamps and append-only activity history are preserved; the result
// passes through the same normalization/backfill as the normal load path.
// Import is gated on "user.manage", export on "settings.read".
import { z } from "zod";
import { requireClientPermission } from "@/lib/auth/client-authorization";
import { getWorkspaceRepository } from "@/lib/repositories";
import {
  WORKSPACE_VERSION,
  normalizeStoredWorkspace,
  type SupplierWorkspace,
} from "@/lib/data/workspace-model";
import {
  PRODUCTION_STATUSES,
  SUPPLIER_PIPELINE_STATUSES,
  SUPPLIER_TYPES,
  VERIFICATION_STATUSES,
} from "@/lib/domain";
import { DEAL_STATUSES } from "@/lib/domain/deal";
import {
  ASSAY_SOURCES,
  COMMUNICATION_DIRECTIONS,
  COMMUNICATION_TYPES,
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_STATUSES,
  INFORMATION_ITEM_STATUSES,
  SUPPLIER_ACTIVITY_TYPES,
  SUPPLIER_DOCUMENT_TYPES,
  SUPPLIER_OUTREACH_STATUSES,
  VERIFICATION_CHECK_STATUSES,
} from "@/lib/domain/supplier-workflow";
import {
  COMMISSION_STATUSES,
  COMMISSION_TYPES,
  COMMERCIAL_VALUE_STATES,
  DEAL_ACTIVITY_TYPES,
  INSPECTION_AGENCIES,
  INSPECTION_POINTS,
  INSPECTION_STATUSES,
  NEGOTIATION_PARTIES,
  PAYMENT_MILESTONE_STATUSES,
  SHIPMENT_STATUSES,
} from "@/lib/domain/deal-workflow";

export const WORKSPACE_EXPORT_FORMAT = "minerallink.supplier-workspace" as const;

export type WorkspaceImportStrategy = "replace" | "merge";

export interface WorkspaceExportEnvelope {
  format: typeof WORKSPACE_EXPORT_FORMAT;
  version: typeof WORKSPACE_VERSION;
  exportedAt: string;
  workspace: SupplierWorkspace;
}

export type WorkspaceImportValidation =
  | { ok: true; workspace: SupplierWorkspace }
  | { ok: false; errors: string[] };

const identifierSchema = z.string().min(1).max(300);
const timestampSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "must be an ISO-8601 timestamp",
});

// Loose objects: unknown fields are preserved (forward/backward compatibility),
// required fields are the invariants the application actually relies on.
const contactSchema = z.looseObject({
  id: identifierSchema,
  name: z.string().min(1),
  isPrimary: z.boolean(),
});

const supplierSchema = z.looseObject({
  id: identifierSchema,
  companyName: z.string().min(1),
  country: z.string().min(1),
  supplierType: z.enum(SUPPLIER_TYPES),
  productionStatus: z.enum(PRODUCTION_STATUSES),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  pipelineStatus: z.enum(SUPPLIER_PIPELINE_STATUSES),
  contacts: z.array(contactSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const dealSchema = z.looseObject({
  id: identifierSchema,
  buyerId: identifierSchema,
  supplierId: identifierSchema,
  requirementId: identifierSchema,
  productId: identifierSchema,
  status: z.enum(DEAL_STATUSES),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const supplierActivitySchema = z.looseObject({
  id: identifierSchema,
  supplierId: identifierSchema,
  type: z.enum(SUPPLIER_ACTIVITY_TYPES),
  title: z.string(),
  details: z.string(),
  createdAt: timestampSchema,
});

const dealActivitySchema = z.looseObject({
  id: identifierSchema,
  dealId: identifierSchema,
  type: z.enum(DEAL_ACTIVITY_TYPES),
  title: z.string(),
  details: z.string(),
  createdAt: timestampSchema,
});

const productSchema = z.looseObject({
  id: identifierSchema,
  supplierId: identifierSchema,
  name: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const assaySchema = z.looseObject({
  id: identifierSchema,
  supplierId: identifierSchema,
  source: z.enum(ASSAY_SOURCES),
  gradePercent: z.number().finite(),
  createdAt: timestampSchema,
});

const documentSchema = z.looseObject({
  id: identifierSchema,
  supplierId: identifierSchema,
  type: z.enum(SUPPLIER_DOCUMENT_TYPES),
  name: z.string().min(1),
  status: z.enum(VERIFICATION_STATUSES),
  createdAt: timestampSchema,
});

const verificationCheckSchema = z.looseObject({
  id: identifierSchema,
  label: z.string().min(1),
  status: z.enum(VERIFICATION_CHECK_STATUSES),
  updatedAt: timestampSchema,
});

const communicationSchema = z.looseObject({
  id: identifierSchema,
  supplierId: identifierSchema,
  type: z.enum(COMMUNICATION_TYPES),
  direction: z.enum(COMMUNICATION_DIRECTIONS),
  occurredAt: timestampSchema,
  subject: z.string(),
  summary: z.string(),
  createdAt: timestampSchema,
});

const followUpSchema = z.looseObject({
  id: identifierSchema,
  supplierId: identifierSchema,
  dueAt: timestampSchema,
  priority: z.enum(FOLLOW_UP_PRIORITIES),
  owner: z.string(),
  action: z.string(),
  status: z.enum(FOLLOW_UP_STATUSES),
  createdAt: timestampSchema,
});

const informationRequestSchema = z.looseObject({
  id: identifierSchema,
  supplierId: identifierSchema,
  itemIds: z.array(z.string().min(1)),
  requestedAt: timestampSchema,
  draftMessage: z.string(),
  createdAt: timestampSchema,
});
const commercialTermsSchema = z.looseObject({
  valueState: z.enum(COMMERCIAL_VALUE_STATES),
  updatedAt: timestampSchema,
});

const negotiationRoundSchema = z.looseObject({
  id: identifierSchema,
  dealId: identifierSchema,
  date: z.string().min(1),
  party: z.enum(NEGOTIATION_PARTIES),
  createdAt: timestampSchema,
});

const commissionSchema = z.looseObject({
  dealId: identifierSchema,
  type: z.enum(COMMISSION_TYPES),
  status: z.enum(COMMISSION_STATUSES),
  updatedAt: timestampSchema,
});

const shipmentSchema = z.looseObject({
  id: identifierSchema,
  dealId: identifierSchema,
  status: z.enum(SHIPMENT_STATUSES),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const inspectionSchema = z.looseObject({
  id: identifierSchema,
  dealId: identifierSchema,
  point: z.enum(INSPECTION_POINTS),
  agency: z.enum(INSPECTION_AGENCIES),
  status: z.enum(INSPECTION_STATUSES),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const paymentMilestoneSchema = z.looseObject({
  id: identifierSchema,
  dealId: identifierSchema,
  milestone: z.string().min(1),
  status: z.enum(PAYMENT_MILESTONE_STATUSES),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Collections absent from older export versions are optional; present values
// must be structurally valid. `suppliers` is required — every export has it.
const workspaceSchema = z.looseObject({
  version: z.number().int().min(1).max(3),
  suppliers: z.array(supplierSchema),
  deals: z.array(dealSchema).optional(),
  followUps: z.array(followUpSchema).optional(),
  informationRequests: z.array(informationRequestSchema).optional(),
  shipments: z.array(shipmentSchema).optional(),
  inspections: z.array(inspectionSchema).optional(),
  paymentMilestones: z.array(paymentMilestoneSchema).optional(),
  products: z.record(z.string(), z.array(productSchema)).optional(),
  assays: z.record(z.string(), z.array(assaySchema)).optional(),
  documents: z.record(z.string(), z.array(documentSchema)).optional(),
  checks: z.record(z.string(), z.array(verificationCheckSchema)).optional(),
  activities: z.record(z.string(), z.array(supplierActivitySchema)).optional(),
  communications: z.record(z.string(), z.array(communicationSchema)).optional(),
  metadata: z.record(z.string(), z.looseObject({})).optional(),
  outreachStatuses: z.record(z.string(), z.enum(SUPPLIER_OUTREACH_STATUSES)).optional(),
  informationStatuses: z.record(z.string(), z.record(z.string(), z.enum(INFORMATION_ITEM_STATUSES))).optional(),
  dealMetadata: z.record(z.string(), z.looseObject({})).optional(),
  commercialTerms: z.record(z.string(), commercialTermsSchema).optional(),
  buyerIntroductions: z.record(z.string(), z.looseObject({})).optional(),
  negotiationRounds: z.record(z.string(), z.array(negotiationRoundSchema)).optional(),
  commissions: z.record(z.string(), commissionSchema).optional(),
  dealActivities: z.record(z.string(), z.array(dealActivitySchema)).optional(),
});

const envelopeSchema = z.looseObject({
  format: z.literal(WORKSPACE_EXPORT_FORMAT),
  version: z.number().int().min(1).max(3),
  exportedAt: timestampSchema,
  workspace: workspaceSchema,
});
export function validateWorkspaceImport(raw: unknown): WorkspaceImportValidation {
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "payload";
        return `${path}: ${issue.message}`;
      }),
    };
  }
  return {
    ok: true,
    workspace: normalizeStoredWorkspace(parsed.data.workspace as unknown as Partial<SupplierWorkspace>),
  };
}

export class WorkspaceImportError extends Error {
  constructor(readonly errors: string[]) {
    super(`Workspace import failed:\n- ${errors.join("\n- ")}`);
    this.name = "WorkspaceImportError";
  }
}

/** Union of id-keyed lists; entries from earlier lists win on id conflicts. */
function unionById<T extends { id: string }>(...lists: Array<T[]>): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

/** Union of supplier-keyed record arrays (products, assays, checks, ...). */
function unionBySupplierKey<T extends { id: string }>(
  current: Record<string, T[]>,
  incoming: Record<string, T[]>,
): Record<string, T[]> {
  const keys = new Set([...Object.keys(current), ...Object.keys(incoming)]);
  return Object.fromEntries(
    [...keys].map((key) => [key, unionById(current[key] ?? [], incoming[key] ?? [])]),
  );
}

/**
 * Merge two records by key. Current values win on conflicts; incoming values
 * only fill keys that are missing from current. `combine` decides per key.
 */
function mergeByKey<T>(
  current: Record<string, T>,
  incoming: Record<string, T>,
  combine: (currentValue: T | undefined, incomingValue: T | undefined) => T,
): Record<string, T> {
  const keys = new Set([...Object.keys(current), ...Object.keys(incoming)]);
  return Object.fromEntries([...keys].map((key) => [key, combine(current[key], incoming[key])]));
}

function sortNewestFirst<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}
function mergeWorkspaces(current: SupplierWorkspace, incoming: SupplierWorkspace): SupplierWorkspace {
  const merged: SupplierWorkspace = {
    version: 3,
    suppliers: unionById(current.suppliers, incoming.suppliers),
    products: unionBySupplierKey(current.products, incoming.products),
    assays: unionBySupplierKey(current.assays, incoming.assays),
    documents: unionBySupplierKey(current.documents, incoming.documents),
    checks: unionBySupplierKey(current.checks, incoming.checks),
    activities: unionBySupplierKey(current.activities, incoming.activities),
    metadata: mergeByKey(current.metadata, incoming.metadata, (a, b) => a ?? (b as SupplierWorkspace["metadata"][string])),
    outreachStatuses: mergeByKey(current.outreachStatuses, incoming.outreachStatuses, (a, b) => a ?? (b as SupplierWorkspace["outreachStatuses"][string])),
    communications: unionBySupplierKey(current.communications, incoming.communications),
    followUps: unionById(current.followUps, incoming.followUps),
    informationRequests: unionById(current.informationRequests, incoming.informationRequests),
    informationStatuses: mergeByKey(
      current.informationStatuses,
      incoming.informationStatuses,
      (a, b): SupplierWorkspace["informationStatuses"][string] => ({
        ...((b ?? {}) as SupplierWorkspace["informationStatuses"][string]),
        ...((a ?? {}) as SupplierWorkspace["informationStatuses"][string]),
      }),
    ),
    deals: unionById(current.deals, incoming.deals),
    dealMetadata: mergeByKey(
      current.dealMetadata,
      incoming.dealMetadata,
      (a, b): SupplierWorkspace["dealMetadata"][string] => ({
        ...((b ?? {}) as SupplierWorkspace["dealMetadata"][string]),
        ...((a ?? {}) as SupplierWorkspace["dealMetadata"][string]),
      }),
    ),
    commercialTerms: mergeByKey(current.commercialTerms, incoming.commercialTerms, (a, b) => a ?? (b as SupplierWorkspace["commercialTerms"][string])),
    buyerIntroductions: mergeByKey(current.buyerIntroductions, incoming.buyerIntroductions, (a, b) => a ?? (b as SupplierWorkspace["buyerIntroductions"][string])),
    negotiationRounds: mergeByKey(current.negotiationRounds, incoming.negotiationRounds, (a, b) => unionById(a ?? [], b ?? [])),
    shipments: unionById(current.shipments, incoming.shipments),
    inspections: unionById(current.inspections, incoming.inspections),
    paymentMilestones: unionById(current.paymentMilestones, incoming.paymentMilestones),
    commissions: mergeByKey(current.commissions, incoming.commissions, (a, b) => a ?? (b as SupplierWorkspace["commissions"][string])),
    dealActivities: mergeByKey(current.dealActivities, incoming.dealActivities, (a, b) => unionById(a ?? [], b ?? [])),
  };
  // Keep append-only feeds sorted newest-first across both sources.
  for (const key of Object.keys(merged.activities)) {
    merged.activities[key] = sortNewestFirst(merged.activities[key]);
  }
  for (const key of Object.keys(merged.dealActivities)) {
    merged.dealActivities[key] = sortNewestFirst(merged.dealActivities[key]);
  }
  return merged;
}

export function exportWorkspace(): WorkspaceExportEnvelope {
  requireClientPermission("settings.read");
  return {
    format: WORKSPACE_EXPORT_FORMAT,
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: getWorkspaceRepository().read(),
  };
}

export function exportWorkspaceJson(): string {
  return JSON.stringify(exportWorkspace(), null, 2);
}

/**
 * Apply a validated payload with an explicit strategy. Throws
 * WorkspaceImportError for malformed payloads and the standard client
 * authorization errors for missing sessions / insufficient roles.
 */
export function importWorkspace(raw: unknown, strategy: WorkspaceImportStrategy): SupplierWorkspace {
  requireClientPermission("user.manage");
  const result = validateWorkspaceImport(raw);
  if (!result.ok) {
    throw new WorkspaceImportError(result.errors);
  }
  const repository = getWorkspaceRepository();
  const next = strategy === "replace"
    ? result.workspace
    : normalizeStoredWorkspace(mergeWorkspaces(repository.read(), result.workspace));
  repository.write(next);
  return next;
}
