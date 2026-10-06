// Phase 7 — deal logistics/finance ops (server-only): shipments,
// inspections, payments, commissions; status tracking only, never execution.
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  DealCommission,
  DealInspectionMilestone,
  DealPaymentMilestone,
  DealShipment,
} from "@/lib/domain/deal-workflow";
import { PersistenceError } from "./persistence-errors";
import { newId } from "./prisma-workspace-repository-concurrency";
import type { ServerActor } from "./prisma-workspace-repository";
import { mapInspectionToPrisma, mapShipmentToPrisma } from "./prisma/shipment-mapper";
import { mapCommissionToPrisma, mapPaymentToPrisma } from "./prisma/finance-mapper";

export async function createShipmentRecord(
  db: PrismaClient,
  input: { shipment: Omit<DealShipment, "id" | "isDemoFixture" | "createdAt" | "updatedAt">; actor: ServerActor },
): Promise<string> {
  const current = await db.deal.findUnique({ where: { id: input.shipment.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const row = mapShipmentToPrisma({
    ...input.shipment, id: newId("shipment"), isDemoFixture: false,
    createdAt: "", updatedAt: "",
  });
  await db.$transaction(async (tx) => {
    await tx.dealShipment.create({
      data: {
        id: row.id, dealId: row.dealId,
        plannedQuantityMt: row.plannedQuantityMt,
        actualQuantityMt: row.actualQuantityMt,
        loadingLocation: row.loadingLocation, destinationPort: row.destinationPort,
        etd: row.etd, eta: row.eta, packing: row.packing,
        inspectionCompany: row.inspectionCompany, inspectionReference: row.inspectionReference,
        billOfLadingReference: row.billOfLadingReference,
        status: row.status, notes: row.notes, isDemoFixture: false,
      },
    });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: row.dealId, type: "SHIPMENT_CREATED",
        title: "Shipment record created", details: row.status,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return row.id;
}

export async function recordInspectionRecord(
  db: PrismaClient,
  input: { inspection: Omit<DealInspectionMilestone, "id" | "createdAt" | "updatedAt">; actor: ServerActor },
): Promise<string> {
  const current = await db.deal.findUnique({ where: { id: input.inspection.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const row = mapInspectionToPrisma({ ...input.inspection, id: newId("inspection"), createdAt: "", updatedAt: "" });
  await db.$transaction(async (tx) => {
    await tx.dealInspectionMilestone.create({
      data: {
        id: row.id, dealId: row.dealId, shipmentId: row.shipmentId,
        point: row.point, agency: row.agency, reference: row.reference,
        date: row.date, status: row.status, resultNotes: row.resultNotes,
      },
    });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: row.dealId, type: "INSPECTION_RECORDED",
        title: "Inspection milestone recorded",
        details: `${row.point} · ${row.agency} · ${row.status}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return row.id;
}

export async function createPaymentMilestoneRecord(
  db: PrismaClient,
  input: { payment: Omit<DealPaymentMilestone, "id" | "createdAt" | "updatedAt">; actor: ServerActor },
): Promise<string> {
  const current = await db.deal.findUnique({ where: { id: input.payment.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const row = mapPaymentToPrisma({ ...input.payment, id: newId("payment"), createdAt: "", updatedAt: "" });
  await db.$transaction(async (tx) => {
    await tx.dealPaymentMilestone.create({
      data: {
        id: row.id, dealId: row.dealId, milestone: row.milestone,
        expectedPercentage: row.expectedPercentage,
        expectedAmount: row.expectedAmount,
        currency: row.currency, dueDate: row.dueDate, status: row.status,
        reference: row.reference, notes: row.notes,
      },
    });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: row.dealId, type: "PAYMENT_MILESTONE_UPDATED",
        title: "Payment milestone recorded",
        details: `${row.milestone} · ${row.status}. Operational tracking only; no payment executed.`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return row.id;
}

export async function saveCommissionRecord(
  db: PrismaClient,
  input: { commission: Omit<DealCommission, "updatedAt">; actor: ServerActor },
): Promise<void> {
  const current = await db.deal.findUnique({ where: { id: input.commission.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const row = mapCommissionToPrisma({ ...input.commission, updatedAt: "" });
  await db.$transaction(async (tx) => {
    await tx.dealCommission.upsert({
      where: { dealId: row.dealId },
      create: {
        dealId: row.dealId, type: row.type,
        percentage: row.percentage ?? undefined, fixedAmount: row.fixedAmount ?? undefined,
        currency: row.currency, status: row.status,
      },
      update: {
        type: row.type,
        percentage: row.percentage ?? undefined, fixedAmount: row.fixedAmount ?? undefined,
        currency: row.currency, status: row.status,
      },
    });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: row.dealId, type: "COMMISSION_UPDATED",
        title: "Commission terms updated", details: `${row.status} · ${row.type}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
}
