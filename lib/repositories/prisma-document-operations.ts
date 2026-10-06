// Phase 7 — document + verification-check writes (server-only).
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  SupplierDocumentRecord,
  VerificationCheckStatus,
} from "@/lib/domain/supplier-workflow";
import { PersistenceError } from "./persistence-errors";
import { newId } from "./prisma-workspace-repository-concurrency";
import type { ServerActor } from "./prisma-workspace-repository";
import { mapCheckToPrisma, mapDocumentToPrisma } from "./prisma/evidence-mapper";

export async function addDocumentRecord(
  db: PrismaClient,
  input: { document: Omit<SupplierDocumentRecord, "id" | "storageState" | "createdAt">; actor: ServerActor },
): Promise<string> {
  const supplier = await db.supplier.findUnique({ where: { id: input.document.supplierId } });
  if (!supplier) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const id = newId("document");
  const row = mapDocumentToPrisma({ ...input.document, id, storageState: "METADATA_ONLY", createdAt: "" });
  await db.$transaction(async (tx) => {
    await tx.supplierDocument.create({
      data: {
        id: row.id, supplierId: row.supplierId, type: row.type, name: row.name,
        reference: row.reference, issuedAt: row.issuedAt, expiresAt: row.expiresAt,
        status: row.status, notes: row.notes, storageState: "METADATA_ONLY",
      },
    });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: row.supplierId, type: "DOCUMENT_RECORDED",
        title: "Document recorded", details: `${row.type} · ${row.name}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
  return id;
}

export async function updateVerificationCheckRecord(
  db: PrismaClient,
  input: { supplierId: string; checkId: string; label: string; status: VerificationCheckStatus; note?: string; actor: ServerActor },
): Promise<void> {
  const supplier = await db.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  const row = mapCheckToPrisma(input.supplierId, {
    id: input.checkId, label: input.label, status: input.status,
    note: input.note, updatedAt: "",
  });
  await db.$transaction(async (tx) => {
    await tx.supplierVerificationCheck.upsert({
      where: { supplierId_checkKey: { supplierId: input.supplierId, checkKey: row.checkKey } },
      create: { id: row.id, supplierId: row.supplierId, checkKey: row.checkKey, label: row.label, status: row.status, note: row.note },
      update: { label: row.label, status: row.status, note: row.note },
    });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: input.supplierId, type: "CHECK_UPDATED",
        title: "Verification check updated", details: `${input.label} · ${input.status}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
}
