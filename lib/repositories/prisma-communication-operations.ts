// Phase 7 — CRM writes (server-only): communications, follow-ups,
// information requests, each paired with an audit activity in one transaction.
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  SupplierCommunication,
  SupplierFollowUp,
  SupplierInformationRequest,
} from "@/lib/domain/supplier-workflow";
import { newId } from "./prisma-workspace-repository-concurrency";
import type { ServerActor } from "./prisma-workspace-repository";
import { mapCommunicationToPrisma } from "./prisma/crm-mapper";
import { mapFollowUpToPrisma } from "./prisma/followup-mapper";
import { mapInformationRequestToPrisma } from "./prisma/followup-mapper";

export async function logCommunicationRecord(
  db: PrismaClient,
  input: { communication: Omit<SupplierCommunication, "id" | "deliveryStatus" | "isDemoFixture" | "createdAt">; actor: ServerActor },
): Promise<string> {
  const id = newId("communication");
  const row = mapCommunicationToPrisma({
    ...input.communication, id, deliveryStatus: "NOT_SENT",
    isDemoFixture: false, createdAt: new Date().toISOString(),
  });
  await db.$transaction(async (tx) => {
    await tx.supplierCommunication.create({
      data: {
        id: row.id, supplierId: row.supplierId, type: row.type, direction: row.direction,
        contactId: row.contactId, requirementId: row.requirementId, occurredAt: row.occurredAt,
        subject: row.subject, summary: row.summary, outcome: row.outcome, nextAction: row.nextAction,
        followUpDate: row.followUpDate, internalNotes: row.internalNotes,
        deliveryStatus: "NOT_SENT", isDemoFixture: false,
      },
    });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: row.supplierId,
        type: "COMMUNICATION_LOGGED", title: "Communication logged",
        details: `${row.subject} · ${row.type}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}

export async function scheduleFollowUpRecord(
  db: PrismaClient,
  input: { followUp: Omit<SupplierFollowUp, "id" | "status" | "isDemoFixture" | "createdAt">; actor: ServerActor },
): Promise<string> {
  const id = newId("follow-up");
  const row = mapFollowUpToPrisma({
    ...input.followUp, id, status: "OPEN",
    isDemoFixture: false, createdAt: new Date().toISOString(),
  });
  await db.$transaction(async (tx) => {
    await tx.supplierFollowUp.create({
      data: {
        id: row.id, supplierId: row.supplierId,
        communicationId: row.communicationId, informationRequestId: row.informationRequestId,
        contactId: row.contactId, dueAt: row.dueAt, priority: row.priority,
        owner: row.owner, action: row.action, status: "OPEN", isDemoFixture: false,
      },
    });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: row.supplierId,
        type: "FOLLOW_UP_SCHEDULED", title: "Follow-up scheduled",
        details: `${row.action} · due ${row.dueAt.toISOString().slice(0, 10)}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}

export async function createInformationRequestRecord(
  db: PrismaClient,
  input: { request: Omit<SupplierInformationRequest, "id" | "deliveryStatus" | "isDemoFixture" | "createdAt">; actor: ServerActor },
): Promise<string> {
  const id = newId("information-request");
  const row = mapInformationRequestToPrisma({
    ...input.request, id, deliveryStatus: "NOT_SENT",
    isDemoFixture: false, createdAt: new Date().toISOString(),
  });
  await db.$transaction(async (tx) => {
    await tx.supplierInformationRequest.create({
      data: {
        id: row.id, supplierId: row.supplierId, contactId: row.contactId,
        requirementId: row.requirementId, itemIds: row.itemIds, requestedAt: row.requestedAt,
        dueAt: row.dueAt, internalNote: row.internalNote, draftMessage: row.draftMessage,
        deliveryStatus: "NOT_SENT", isDemoFixture: false,
      },
    });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: row.supplierId,
        type: "INFORMATION_REQUESTED", title: "Information request prepared",
        details: `${row.itemIds.length} information items selected.`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}
