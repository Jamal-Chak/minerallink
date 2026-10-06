// Phase 7 — idempotent server import, part 2: CRM collections + deals.
// Follow-ups, information requests, deals and commercial terms via upsert.
import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import type { SupplierWorkspace } from "@/lib/data/workspace-model";
import { mapFollowUpToPrisma, mapInformationRequestToPrisma } from "@/lib/repositories/prisma/followup-mapper";
import { mapDealToPrisma, mapTermsToPrisma } from "@/lib/repositories/prisma/deal-mapper";
import type { ImportConflict } from "@/lib/repositories/server-import";

export interface DealImportOutcome {
  importedDeals: number;
  dealConflicts: ImportConflict[];
}

export async function importCrmAndDealsToServer(
  db: PrismaClient,
  workspace: SupplierWorkspace,
): Promise<DealImportOutcome> {
  const dealConflicts: ImportConflict[] = [];
  let importedDeals = 0;

  for (const followUp of workspace.followUps) {
    const r = mapFollowUpToPrisma(followUp);
    await db.supplierFollowUp.upsert({
      where: { id: r.id },
      create: {
        id: r.id, supplierId: r.supplierId,
        communicationId: r.communicationId, informationRequestId: r.informationRequestId,
        contactId: r.contactId, dueAt: r.dueAt, priority: r.priority,
        owner: r.owner, action: r.action, status: r.status,
        completedAt: r.completedAt, isDemoFixture: false,
      },
      update: {},
    });
  }

  for (const request of workspace.informationRequests) {
    const r = mapInformationRequestToPrisma(request);
    await db.supplierInformationRequest.upsert({
      where: { id: r.id },
      create: {
        id: r.id, supplierId: r.supplierId, contactId: r.contactId,
        requirementId: r.requirementId, itemIds: r.itemIds, requestedAt: r.requestedAt,
        dueAt: r.dueAt, internalNote: r.internalNote, draftMessage: r.draftMessage,
        deliveryStatus: "NOT_SENT", isDemoFixture: false,
      },
      update: {},
    });
  }

  for (const deal of workspace.deals) {
    const existing = await db.deal.findUnique({ where: { id: deal.id } });
    if (existing && existing.status !== deal.status) {
      dealConflicts.push({ kind: "deal", id: deal.id, detail: `Server stage ${existing.status} kept over import stage ${deal.status}.` });
      continue;
    }
    if (!existing) {
      const row = mapDealToPrisma(deal, workspace.dealMetadata[deal.id]);
      await db.deal.create({
        data: {
          id: row.id, buyerId: row.buyerId, supplierId: row.supplierId,
          requirementId: row.requirementId, productId: row.productId, status: row.status,
          supplyType: row.supplyType, destination: row.destination,
          isDemoFixture: row.isDemoFixture, createdFromMatch: row.createdFromMatch,
          // Absent match evidence is SQL NULL (Prisma.DbNull), never JSON null.
          matchResult: row.matchResult === null ? Prisma.DbNull : (row.matchResult as Prisma.InputJsonValue),
          matchEvidenceSource: row.matchEvidenceSource,
          quantityMt: row.quantityMt,
          currency: row.currency,
          pricePerMt: row.pricePerMt,
          commissionPercent: row.commissionPercent,
          commissionAmount: row.commissionAmount,
          notes: row.notes,
        },
      });
      const terms = workspace.commercialTerms[deal.id];
      if (terms) {
        const rowT = mapTermsToPrisma(deal.id, terms);
        await db.dealCommercialTerms.upsert({ where: { dealId: deal.id }, create: { ...rowT }, update: { ...rowT, dealId: undefined } });
      }
      importedDeals += 1;
    }
  }

  return { importedDeals, dealConflicts };
}
