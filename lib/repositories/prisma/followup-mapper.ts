// Phase 7 — CRM mapping part 2: follow-ups, information requests, item status.
import type {
  InformationItemStatus,
  InformationRequestItemId,
  SupplierFollowUp,
  SupplierInformationRequest,
} from "@/lib/domain/supplier-workflow";
import { assertId, fromDate, toDate } from "./decimal-mapping";

export interface PrismaFollowUpRow {
  id: string; supplierId: string;
  communicationId: string | null; informationRequestId: string | null; contactId: string | null;
  dueAt: Date; priority: SupplierFollowUp["priority"]; owner: string; action: string;
  status: SupplierFollowUp["status"]; completedAt: Date | null;
  isDemoFixture: boolean; createdAt: Date;
}

export function mapFollowUpToPrisma(f: SupplierFollowUp): Omit<PrismaFollowUpRow, "createdAt"> {
  assertId(f.id, "follow-up id");
  return {
    id: f.id, supplierId: f.supplierId,
    communicationId: f.communicationId ?? null, informationRequestId: f.informationRequestId ?? null,
    contactId: f.contactId ?? null, dueAt: toDate(f.dueAt) ?? new Date(f.dueAt),
    priority: f.priority, owner: f.owner, action: f.action, status: f.status,
    completedAt: toDate(f.completedAt) ?? null, isDemoFixture: f.isDemoFixture,
  };
}

export function mapPrismaToFollowUp(row: PrismaFollowUpRow): SupplierFollowUp {
  return {
    id: row.id, supplierId: row.supplierId,
    communicationId: row.communicationId ?? undefined,
    informationRequestId: row.informationRequestId ?? undefined,
    contactId: row.contactId ?? undefined, dueAt: row.dueAt.toISOString(),
    priority: row.priority, owner: row.owner, action: row.action, status: row.status,
    completedAt: fromDate(row.completedAt), isDemoFixture: row.isDemoFixture,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface PrismaInformationRequestRow {
  id: string; supplierId: string; contactId: string | null; requirementId: string | null;
  itemIds: string[]; requestedAt: Date; dueAt: string | null; internalNote: string | null;
  draftMessage: string; deliveryStatus: string; isDemoFixture: boolean; createdAt: Date;
}

export function mapInformationRequestToPrisma(r: SupplierInformationRequest): Omit<PrismaInformationRequestRow, "createdAt"> {
  assertId(r.id, "information request id");
  return {
    id: r.id, supplierId: r.supplierId, contactId: r.contactId ?? null,
    requirementId: r.requirementId ?? null, itemIds: [...r.itemIds],
    requestedAt: toDate(r.requestedAt) ?? new Date(r.requestedAt),
    dueAt: r.dueAt ?? null, internalNote: r.internalNote ?? null,
    draftMessage: r.draftMessage, deliveryStatus: r.deliveryStatus, isDemoFixture: r.isDemoFixture,
  };
}

export function mapPrismaToInformationRequest(row: PrismaInformationRequestRow): SupplierInformationRequest {
  return {
    id: row.id, supplierId: row.supplierId,
    contactId: row.contactId ?? undefined, requirementId: row.requirementId ?? undefined,
    itemIds: [...row.itemIds] as InformationRequestItemId[],
    requestedAt: row.requestedAt.toISOString(), dueAt: row.dueAt ?? undefined,
    internalNote: row.internalNote ?? undefined, draftMessage: row.draftMessage,
    deliveryStatus: "NOT_SENT", isDemoFixture: row.isDemoFixture,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface PrismaInformationItemStatusRow {
  id: string; supplierId: string; itemId: string; status: InformationItemStatus;
}

export function mapInformationStatusToPrisma(
  supplierId: string, itemId: InformationRequestItemId, status: InformationItemStatus,
): PrismaInformationItemStatusRow {
  return { id: `${supplierId}:${itemId}`, supplierId, itemId, status };
}
