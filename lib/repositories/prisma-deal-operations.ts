// Phase 7 — deal core operations (server-only): read aggregate, create,
// stage change with audit + optimistic concurrency.
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { Deal } from "@/lib/domain";
import type { DealMetadata } from "@/lib/domain/deal-workflow";
import { PersistenceError } from "./persistence-errors";
import { checkConcurrency, newId } from "./prisma-workspace-repository-concurrency";
import type { DealAggregate, ServerActor } from "./prisma-workspace-repository";
import { mapDealToPrisma, mapPrismaToDeal, mapPrismaToTerms } from "./prisma/deal-mapper";
import { mapPrismaToIntroduction, mapPrismaToNegotiation } from "./prisma/deal-workflow-mapper";
import { mapPrismaToInspection, mapPrismaToShipment } from "./prisma/shipment-mapper";
import { mapPrismaToCommission, mapPrismaToDealActivity, mapPrismaToPayment } from "./prisma/finance-mapper";

export async function readDealAggregate(db: PrismaClient, dealId: string): Promise<{ deal: Deal; aggregate: DealAggregate } | null> {
  const row = await db.deal.findUnique({
    where: { id: dealId },
    include: {
      commercialTerms: true, introduction: true,
      negotiationRounds: { orderBy: { date: "asc" } },
      shipments: true, inspections: true, paymentMilestones: true,
      commission: true, activities: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!row) return null;
  const { deal, metadata } = mapPrismaToDeal(row);
  return {
    deal,
    aggregate: {
      metadata,
      commercialTerms: row.commercialTerms ? mapPrismaToTerms(row.commercialTerms, deal.updatedAt) : undefined,
      introduction: row.introduction ? mapPrismaToIntroduction(row.introduction) : undefined,
      negotiations: row.negotiationRounds.map((r) => mapPrismaToNegotiation(r)),
      shipments: row.shipments.map((s) => mapPrismaToShipment(s)),
      inspections: row.inspections.map((m) => mapPrismaToInspection(m)),
      payments: row.paymentMilestones.map((p) => mapPrismaToPayment(p)),
      commission: row.commission ? mapPrismaToCommission(row.commission, deal.updatedAt) : undefined,
      activities: row.activities.map((a) => mapPrismaToDealActivity(a)),
    },
  };
}

export async function createDealRecord(
  db: PrismaClient,
  input: {
    id?: string;
    buyerId: string; supplierId: string; requirementId: string; productId: string;
    supplyType: DealMetadata["supplyType"]; destination?: string;
    quantityMt?: number; currency?: string; pricePerMt?: number;
    notes?: string; actor: ServerActor;
  },
): Promise<string> {
  const dealId = input.id ?? newId("deal");
  const timestamp = new Date().toISOString();
  const deal: Deal = {
    id: dealId, buyerId: input.buyerId, supplierId: input.supplierId,
    requirementId: input.requirementId, productId: input.productId, status: "NEW",
    quantityMt: input.quantityMt, currency: input.currency, pricePerMt: input.pricePerMt,
    notes: input.notes, createdAt: timestamp, updatedAt: timestamp,
  };
  const metadata: DealMetadata = {
    isDemoFixture: false, supplyType: input.supplyType, destination: input.destination,
  };
  const dealRow = mapDealToPrisma(deal, metadata);
  await db.$transaction(async (tx) => {
    await tx.deal.create({
      data: {
        id: dealRow.id, buyerId: dealRow.buyerId, supplierId: dealRow.supplierId,
        requirementId: dealRow.requirementId, productId: dealRow.productId, status: "NEW",
        supplyType: dealRow.supplyType, destination: dealRow.destination,
        isDemoFixture: false, createdFromMatch: false,
        quantityMt: dealRow.quantityMt, currency: dealRow.currency,
        pricePerMt: dealRow.pricePerMt, notes: dealRow.notes,
      },
    });
    await tx.dealCommercialTerms.create({
      data: {
        dealId, quantityMt: dealRow.quantityMt, currency: dealRow.currency,
        pricePerMt: dealRow.pricePerMt, valueState: "INDICATIVE",
      },
    });
    await tx.dealCommission.create({ data: { dealId, type: "PERCENTAGE", status: "NOT_AGREED" } });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId, type: "DEAL_CREATED",
        title: "Deal created", details: `${input.supplyType} opportunity created through the server repository.`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return dealId;
}

export async function transitionDealStage(
  db: PrismaClient,
  input: { dealId: string; status: Deal["status"]; expectedUpdatedAt?: string; actor: ServerActor },
): Promise<void> {
  const current = await db.deal.findUnique({ where: { id: input.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  checkConcurrency(current.updatedAt, input.expectedUpdatedAt);
  if (current.status === input.status) return;
  const previous = current.status;
  const closed = input.status === "COMPLETED" || input.status === "CANCELLED";
  await db.$transaction(async (tx) => {
    await tx.deal.update({ where: { id: input.dealId }, data: { status: input.status } });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: input.dealId,
        type: closed ? "DEAL_CLOSED" : input.status === "CONTRACT" ? "CONTRACT_MILESTONE" : "STAGE_CHANGED",
        title: closed ? `Deal ${input.status.toLowerCase()}` : "Deal stage changed",
        details: `${previous} → ${input.status}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
}
