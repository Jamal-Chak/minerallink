// Phase 7 — idempotent server import, part 1: suppliers + evidence.
// Stable browser ids reused as Prisma ids; conflicts keep server version.
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type { SupplierWorkspace } from "@/lib/data/workspace-model";
import { PersistenceError } from "@/lib/repositories/persistence-errors";
import type { ServerActor } from "@/lib/repositories/prisma-workspace-repository";
import { mapSupplierToPrisma } from "@/lib/repositories/prisma/supplier-mapper";
import { mapProductToPrisma } from "@/lib/repositories/prisma/product-mapper";
import { mapAssayToPrisma, mapActivityToPrisma, mapCheckToPrisma, mapDocumentToPrisma } from "@/lib/repositories/prisma/evidence-mapper";
import { mapCommunicationToPrisma } from "@/lib/repositories/prisma/crm-mapper";
import type { ImportConflict } from "@/lib/repositories/server-import";

export interface SupplierImportOutcome {
  importedSuppliers: number;
  supplierConflicts: ImportConflict[];
}

export async function importSuppliersToServer(
  db: PrismaClient,
  workspace: SupplierWorkspace,
  actor: ServerActor,
): Promise<SupplierImportOutcome> {
  if (!workspace || !Array.isArray(workspace.suppliers)) {
    throw new PersistenceError("VALIDATION", "The request was invalid.");
  }
  const supplierConflicts: ImportConflict[] = [];
  let importedSuppliers = 0;

  for (const supplier of workspace.suppliers) {
    const existing = await db.supplier.findUnique({ where: { id: supplier.id } });
    if (existing && existing.companyName !== supplier.companyName) {
      supplierConflicts.push({ kind: "supplier", id: supplier.id, detail: `Server kept ("${existing.companyName}") over import ("${supplier.companyName}").` });
      continue;
    }
    if (!existing) {
      const payload = mapSupplierToPrisma(supplier, workspace.metadata[supplier.id], workspace.outreachStatuses[supplier.id]);
      await db.supplier.create({
        data: { ...payload.supplier, supplyCountry: payload.supplier.supplyCountry ?? supplier.country },
      });
      if (payload.contacts.length > 0) {
        await db.supplierContact.createMany({ data: payload.contacts, skipDuplicates: true });
      }
      importedSuppliers += 1;
    }
    for (const product of workspace.products[supplier.id] ?? []) {
      const row = mapProductToPrisma(product);
      await db.mineralProduct.upsert({
        where: { id: row.id },
        create: {
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
        update: {},
      });
    }
    for (const assay of workspace.assays[supplier.id] ?? []) {
      const r = mapAssayToPrisma(assay);
      await db.assay.upsert({
        where: { id: r.id },
        create: {
          id: r.id, productId: r.productId, source: r.source,
          gradePercent: r.gradePercent, sulphurPercent: r.sulphurPercent,
          arsenicPercent: r.arsenicPercent, chlorinePercent: r.chlorinePercent,
          cadmiumPercent: r.cadmiumPercent, mercuryPercent: r.mercuryPercent,
          fluorinePercent: r.fluorinePercent, leadPercent: r.leadPercent,
          zincPercent: r.zincPercent, particleSizeMm: r.particleSizeMm,
          laboratoryName: r.laboratoryName, certificateRef: r.certificateRef,
          testedAt: r.testedAt, notes: r.notes,
        },
        update: {},
      });
    }
    for (const document of workspace.documents[supplier.id] ?? []) {
      const r = mapDocumentToPrisma(document);
      await db.supplierDocument.upsert({
        where: { id: r.id },
        create: {
          id: r.id, supplierId: r.supplierId, type: r.type, name: r.name,
          reference: r.reference, issuedAt: r.issuedAt, expiresAt: r.expiresAt,
          status: r.status, notes: r.notes, storageState: "METADATA_ONLY",
        },
        update: {},
      });
    }
    for (const check of workspace.checks[supplier.id] ?? []) {
      const r = mapCheckToPrisma(supplier.id, check);
      await db.supplierVerificationCheck.upsert({
        where: { supplierId_checkKey: { supplierId: supplier.id, checkKey: r.checkKey } },
        create: { id: r.id, supplierId: r.supplierId, checkKey: r.checkKey, label: r.label, status: r.status, note: r.note },
        update: {},
      });
    }
    for (const activity of workspace.activities[supplier.id] ?? []) {
      const r = mapActivityToPrisma(activity);
      await db.supplierActivity.upsert({
        where: { id: r.id },
        create: {
          id: r.id, supplierId: r.supplierId, type: r.type,
          title: r.title, details: r.details,
          actorUserId: r.actorUserId ?? actor.id, actorName: r.actorName ?? actor.name,
        },
        update: {},
      });
    }
    for (const communication of workspace.communications[supplier.id] ?? []) {
      const r = mapCommunicationToPrisma(communication);
      await db.supplierCommunication.upsert({
        where: { id: r.id },
        create: {
          id: r.id, supplierId: r.supplierId, type: r.type, direction: r.direction,
          contactId: r.contactId, requirementId: r.requirementId, occurredAt: r.occurredAt,
          subject: r.subject, summary: r.summary, outcome: r.outcome, nextAction: r.nextAction,
          followUpDate: r.followUpDate, internalNotes: r.internalNotes,
          deliveryStatus: "NOT_SENT", isDemoFixture: false,
        },
        update: {},
      });
    }
  }

  return { importedSuppliers, supplierConflicts };
}
