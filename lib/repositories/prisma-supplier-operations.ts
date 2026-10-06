// Phase 7 — supplier read/create operations (server-only).
// Reads pass Prisma models straight into the pure mapper row shapes; domain
// mapping itself stays fully typed via the pure mapper modules.
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { Supplier } from "@/lib/domain";
import type { ServerActor, SupplierAggregate } from "./prisma-workspace-repository";
import { mapPrismaToSupplier } from "./prisma/supplier-mapper";
import { mapPrismaToActivity, mapPrismaToAssay, mapPrismaToCheck, mapPrismaToDocument } from "./prisma/evidence-mapper";
import { mapPrismaToProduct } from "./prisma/product-mapper";
import { mapPrismaToCommunication } from "./prisma/crm-mapper";
import { mapPrismaToFollowUp, mapPrismaToInformationRequest } from "./prisma/followup-mapper";
import { newId } from "./prisma-workspace-repository-concurrency";

export async function readSupplierAggregate(
  db: PrismaClient,
  supplierId: string,
): Promise<SupplierAggregate | null> {
  const row = await db.supplier.findUnique({
    where: { id: supplierId },
    include: {
      contacts: true,
      products: { include: { assays: true } },
      documents: true,
      verificationChecks: true,
      activities: { orderBy: { createdAt: "desc" } },
      communications: { orderBy: { occurredAt: "desc" } },
      followUps: { orderBy: { dueAt: "asc" } },
      informationRequests: { orderBy: { requestedAt: "desc" } },
    },
  });
  if (!row) return null;
  const { supplier, metadata, outreachStatus } = mapPrismaToSupplier(row, row.contacts);
  return {
    supplier,
    metadata,
    outreachStatus,
    contacts: supplier.contacts,
    products: row.products.map((p) => mapPrismaToProduct(p)),
    assays: row.products.flatMap((p) => p.assays.map((a) => mapPrismaToAssay(a, supplier.id))),
    documents: row.documents.map((d) => mapPrismaToDocument(d)),
    checks: row.verificationChecks.map((c) => mapPrismaToCheck(c, supplier.updatedAt)),
    activities: row.activities.map((a) => mapPrismaToActivity(a)),
    communications: row.communications.map((c) => mapPrismaToCommunication(c)),
    followUps: row.followUps.map((f) => mapPrismaToFollowUp(f)),
    informationRequests: row.informationRequests.map((r) => mapPrismaToInformationRequest(r)),
  };
}

export async function createSupplierRecord(
  db: PrismaClient,
  input: {
    id?: string;
    companyName: string;
    tradingName?: string;
    country: string;
    supplierType: Supplier["supplierType"];
    productionStatus?: Supplier["productionStatus"];
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    source: string;
    supplyCountry: string;
    loadingLocation?: string;
    availableForExport: boolean;
    notes?: string;
    actor: ServerActor;
  },
): Promise<string> {
  const supplierId = input.id ?? newId("supplier");
  const contactId = newId("contact");
  await db.$transaction(async (tx) => {
    await tx.supplier.create({
      data: {
        id: supplierId,
        companyName: input.companyName,
        tradingName: input.tradingName ?? null,
        country: input.country,
        supplierType: input.supplierType,
        productionStatus: input.productionStatus ?? "UNKNOWN",
        verificationStatus: "UNVERIFIED",
        pipelineStatus: "NEW",
        notes: input.notes ?? null,
        outreachStatus: "NOT_CONTACTED",
        source: input.source,
        isDemoFixture: false,
        supplyCountry: input.supplyCountry,
        loadingLocation: input.loadingLocation ?? null,
        availableForExport: input.availableForExport,
      },
    });
    await tx.supplierContact.create({
      data: {
        id: contactId,
        supplierId,
        name: input.contactName,
        email: input.contactEmail ?? null,
        phone: input.contactPhone ?? null,
        isPrimary: true,
      },
    });
    await tx.supplierActivity.createMany({
      data: [
        {
          id: newId("activity"),
          supplierId,
          type: "SUPPLIER_CREATED",
          title: "Supplier created",
          details: "New supplier record added through the server repository.",
          actorUserId: input.actor.id,
          actorName: input.actor.name,
        },
        {
          id: newId("activity"),
          supplierId,
          type: "CONTACT_ADDED",
          title: "Primary contact added",
          details: input.contactName,
          actorUserId: input.actor.id,
          actorName: input.actor.name,
        },
      ],
    });
  });
  return supplierId;
}
