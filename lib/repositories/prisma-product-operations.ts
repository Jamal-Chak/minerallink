// Phase 7 — product + assay writes (server-only), each with audit activity.
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type { MineralProduct } from "@/lib/domain";
import type { SupplierAssay } from "@/lib/domain/supplier-workflow";
import { PersistenceError } from "./persistence-errors";
import { newId } from "./prisma-workspace-repository-concurrency";
import type { ServerActor } from "./prisma-workspace-repository";
import { mapAssayToPrisma } from "./prisma/evidence-mapper";
import { mapProductToPrisma } from "./prisma/product-mapper";

export async function addProductRecord(
  db: PrismaClient,
  input: { product: Omit<MineralProduct, "id" | "createdAt" | "updatedAt">; actor: ServerActor },
): Promise<string> {
  const supplier = await db.supplier.findUnique({ where: { id: input.product.supplierId } });
  if (!supplier) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const id = newId("product");
  const row = mapProductToPrisma({ ...input.product, id, createdAt: "", updatedAt: "" });
  await db.$transaction(async (tx) => {
    await tx.mineralProduct.create({
      data: {
        id: row.id, supplierId: row.supplierId, name: row.name,
        commodity: row.commodity, productType: row.productType,
        // `mapProductToPrisma` always builds a non-null specification object.
        specification: row.specification as Prisma.InputJsonValue, mineralForm: row.mineralForm,
        availableQuantityMt: row.availableQuantityMt,
        monthlyCapacityMt: row.monthlyCapacityMt,
        trialQuantityMt: row.trialQuantityMt,
        loadingCountry: row.loadingCountry, loadingLocation: row.loadingLocation,
        availableForExport: row.availableForExport,
      },
    });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: row.supplierId, type: "PRODUCT_ADDED",
        title: "Product details recorded",
        details: `${row.name}; supplier-reported specification, not an independent assay.`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}

export async function addAssayRecord(
  db: PrismaClient,
  input: { supplierId: string; assay: Omit<SupplierAssay, "id" | "supplierId" | "createdAt">; actor: ServerActor },
): Promise<string> {
  const supplier = await db.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const id = newId("assay");
  const row = mapAssayToPrisma({ ...input.assay, id, supplierId: input.supplierId, createdAt: "" });
  await db.$transaction(async (tx) => {
    await tx.assay.create({
      data: {
        id: row.id, productId: row.productId, source: row.source,
        gradePercent: row.gradePercent, sulphurPercent: row.sulphurPercent,
        arsenicPercent: row.arsenicPercent, chlorinePercent: row.chlorinePercent,
        cadmiumPercent: row.cadmiumPercent, mercuryPercent: row.mercuryPercent,
        fluorinePercent: row.fluorinePercent, leadPercent: row.leadPercent,
        zincPercent: row.zincPercent, particleSizeMm: row.particleSizeMm,
        laboratoryName: row.laboratoryName, certificateRef: row.certificateRef,
        testedAt: row.testedAt, notes: row.notes,
      },
    });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: input.supplierId, type: "ASSAY_RECEIVED",
        title: "Assay recorded", details: `${row.source} · ${input.assay.gradePercent}%`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}
