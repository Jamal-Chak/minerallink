// Phase 7 — deal commercial ops (server-only): terms, negotiations,
// introductions, each with a DealActivity audit row in one transaction.
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  BuyerIntroduction,
  DealCommercialTerms,
  DealNegotiationRound,
} from "@/lib/domain/deal-workflow";
import { PersistenceError } from "./persistence-errors";
import { newId } from "./prisma-workspace-repository-concurrency";
import type { ServerActor } from "./prisma-workspace-repository";
import { mapTermsToPrisma } from "./prisma/deal-mapper";
import { mapNegotiationToPrisma } from "./prisma/deal-workflow-mapper";

export async function saveCommercialTermsRecord(
  db: PrismaClient,
  input: { dealId: string; terms: Omit<DealCommercialTerms, "updatedAt">; actor: ServerActor },
): Promise<void> {
  const current = await db.deal.findUnique({ where: { id: input.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const terms: DealCommercialTerms = { ...input.terms, updatedAt: new Date().toISOString() };
  const row = mapTermsToPrisma(input.dealId, terms);
  await db.$transaction(async (tx) => {
    await tx.dealCommercialTerms.upsert({
      where: { dealId: input.dealId },
      create: { ...row },
      update: { ...row, dealId: undefined },
    });
    await tx.deal.update({
      where: { id: input.dealId },
      data: { quantityMt: row.quantityMt ?? undefined, currency: row.currency, pricePerMt: row.pricePerMt ?? undefined },
    });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: input.dealId, type: "OFFER_RECORDED",
        title: "Commercial terms updated",
        details: `${terms.valueState} · ${terms.currency ?? "Currency unknown"}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
}

export async function appendNegotiationRecord(
  db: PrismaClient,
  input: { negotiation: Omit<DealNegotiationRound, "id" | "createdAt">; actor: ServerActor },
): Promise<string> {
  const current = await db.deal.findUnique({ where: { id: input.negotiation.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const id = newId("negotiation");
  const row = mapNegotiationToPrisma({ ...input.negotiation, id, createdAt: new Date().toISOString() });
  await db.$transaction(async (tx) => {
    await tx.dealNegotiationRound.create({
      data: {
        id: row.id, dealId: row.dealId, date: row.date, party: row.party,
        quantityMt: row.quantityMt, pricePerMt: row.pricePerMt,
        currency: row.currency, incoterm: row.incoterm, paymentMethod: row.paymentMethod,
        paymentTerms: row.paymentTerms, destination: row.destination, comments: row.comments,
      },
    });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: row.dealId,
        type: row.party === "BUYER" ? "COUNTEROFFER_RECORDED" : "OFFER_RECORDED",
        title: "Negotiation round recorded", details: `${row.party} · ${row.date}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}

export async function recordIntroductionRecord(
  db: PrismaClient,
  input: { introduction: Omit<BuyerIntroduction, "id" | "createdAt">; actor: ServerActor },
): Promise<string> {
  const current = await db.deal.findUnique({ where: { id: input.introduction.dealId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const id = newId("introduction");
  await db.$transaction(async (tx) => {
    await tx.buyerIntroduction.upsert({
      where: { dealId: input.introduction.dealId },
      create: {
        id, dealId: input.introduction.dealId, introducedAt: input.introduction.introducedAt,
        supplierContactId: input.introduction.supplierContactId ?? null,
        buyerContactName: input.introduction.buyerContactName ?? null,
        buyerContactEmail: input.introduction.buyerContactEmail ?? null,
        requirementId: input.introduction.requirementId,
        introducedBy: input.introduction.introducedBy,
        internalNotes: input.introduction.internalNotes ?? null,
      },
      update: {
        introducedAt: input.introduction.introducedAt,
        supplierContactId: input.introduction.supplierContactId ?? null,
        buyerContactName: input.introduction.buyerContactName ?? null,
        buyerContactEmail: input.introduction.buyerContactEmail ?? null,
        requirementId: input.introduction.requirementId,
        introducedBy: input.introduction.introducedBy,
        internalNotes: input.introduction.internalNotes ?? null,
      },
    });
    await tx.dealActivity.create({
      data: {
        id: newId("deal-activity"), dealId: input.introduction.dealId, type: "BUYER_INTRODUCED",
        title: "Buyer introduced", details: input.introduction.introducedBy,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}
