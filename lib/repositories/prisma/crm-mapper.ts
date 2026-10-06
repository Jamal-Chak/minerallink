// Phase 7 — CRM mapping part 1: communications (pure, structural rows).
import type { SupplierCommunication } from "@/lib/domain/supplier-workflow";
import { assertId, toDate } from "./decimal-mapping";

export interface PrismaCommunicationRow {
  id: string; supplierId: string;
  type: SupplierCommunication["type"]; direction: SupplierCommunication["direction"];
  contactId: string | null; requirementId: string | null;
  occurredAt: Date; subject: string; summary: string;
  outcome: string | null; nextAction: string | null; followUpDate: string | null;
  internalNotes: string | null; deliveryStatus: string; isDemoFixture: boolean;
  createdAt: Date;
}

export function mapCommunicationToPrisma(c: SupplierCommunication): Omit<PrismaCommunicationRow, "createdAt"> {
  assertId(c.id, "communication id");
  return {
    id: c.id, supplierId: c.supplierId, type: c.type, direction: c.direction,
    contactId: c.contactId ?? null, requirementId: c.requirementId ?? null,
    occurredAt: toDate(c.occurredAt) ?? new Date(c.occurredAt),
    subject: c.subject, summary: c.summary, outcome: c.outcome ?? null,
    nextAction: c.nextAction ?? null, followUpDate: c.followUpDate ?? null,
    internalNotes: c.internalNotes ?? null, deliveryStatus: c.deliveryStatus,
    isDemoFixture: c.isDemoFixture,
  };
}

export function mapPrismaToCommunication(row: PrismaCommunicationRow): SupplierCommunication {
  return {
    id: row.id, supplierId: row.supplierId, type: row.type, direction: row.direction,
    contactId: row.contactId ?? undefined, requirementId: row.requirementId ?? undefined,
    occurredAt: row.occurredAt.toISOString(), subject: row.subject, summary: row.summary,
    outcome: row.outcome ?? undefined, nextAction: row.nextAction ?? undefined,
    followUpDate: row.followUpDate ?? undefined, internalNotes: row.internalNotes ?? undefined,
    deliveryStatus: "NOT_SENT", isDemoFixture: row.isDemoFixture,
    createdAt: row.createdAt.toISOString(),
  };
}
