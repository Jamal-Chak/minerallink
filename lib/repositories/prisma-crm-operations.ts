// Phase 7 — supplier transitions (server-only): verification + pipeline with
// audit rows and optimistic concurrency, inside transactions.
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { Supplier } from "@/lib/domain";
import { PersistenceError } from "./persistence-errors";
import { checkConcurrency, newId } from "./prisma-workspace-repository-concurrency";
import type { ServerActor } from "./prisma-workspace-repository";

export async function transitionSupplierVerification(
  db: PrismaClient,
  input: { supplierId: string; status: Supplier["verificationStatus"]; reason: string; expectedUpdatedAt?: string; actor: ServerActor },
): Promise<void> {
  const current = await db.supplier.findUnique({ where: { id: input.supplierId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  checkConcurrency(current.updatedAt, input.expectedUpdatedAt);
  const previous = current.verificationStatus;
  await db.$transaction(async (tx) => {
    await tx.supplier.update({ where: { id: input.supplierId }, data: { verificationStatus: input.status } });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: input.supplierId,
        type: input.status === "VERIFIED" ? "VERIFICATION_COMPLETED" : input.status === "REJECTED" ? "SUPPLIER_REJECTED" : "VERIFICATION_CHANGED",
        title: input.status === "VERIFIED" ? "Supplier verified" : input.status === "REJECTED" ? "Supplier rejected" : "Verification status changed",
        details: `${previous} → ${input.status} · ${input.reason.trim()}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
}

export async function transitionSupplierPipeline(
  db: PrismaClient,
  input: { supplierId: string; status: Supplier["pipelineStatus"]; expectedUpdatedAt?: string; actor: ServerActor },
): Promise<void> {
  const current = await db.supplier.findUnique({ where: { id: input.supplierId } });
  if (!current) throw new PersistenceError("NOT_FOUND", "The requested record was not found.");
  checkConcurrency(current.updatedAt, input.expectedUpdatedAt);
  const previous = current.pipelineStatus;
  await db.$transaction(async (tx) => {
    await tx.supplier.update({ where: { id: input.supplierId }, data: { pipelineStatus: input.status } });
    await tx.supplierActivity.create({
      data: {
        id: newId("activity"), supplierId: input.supplierId,
        type: "PIPELINE_CHANGED", title: "Pipeline stage changed",
        details: `${previous} → ${input.status}`,
        actorUserId: input.actor.id, actorName: input.actor.name,
      },
    });
  });
}
