// Phase 7 — supplier command boundary (server-only).
// POST /api/workspace/suppliers/commands { command, payload }
// Permissions per command use the exact Phase 5 matrix (no duplicates).
import { prisma } from "@/lib/db";
import { ok, persistenceFailure, readSessionCookie, serverActorFromCookie } from "@/lib/repositories/server-route-helpers";
import {
  serverCommunicationSchema,
  serverFollowUpSchema,
  serverPipelineSchema,
  serverSupplierCreateSchema,
  serverSupplierProfileSchema,
  serverVerificationSchema,
} from "@/lib/repositories/prisma/server-commands";
import { createSupplierRecord, readSupplierAggregate } from "@/lib/repositories/prisma-supplier-operations";
import { transitionSupplierPipeline, transitionSupplierVerification } from "@/lib/repositories/prisma-crm-operations";
import { logCommunicationRecord, scheduleFollowUpRecord } from "@/lib/repositories/prisma-communication-operations";
import { z } from "zod";

export const dynamic = "force-dynamic";

const commandSchema = z.object({ command: z.string().min(1), payload: z.unknown() });

export async function POST(request: Request): Promise<Response> {
  try {
    const cookie = readSessionCookie(request);
    const body = (await request.json().catch(() => null)) as { command?: string; payload?: unknown } | null;
    const parsed = commandSchema.safeParse(body);
    if (!parsed.success) return persistenceFailure("suppliers.parse", parsed.error);
    const { command, payload } = parsed.data;

    if (command === "supplier.create") {
      const input = serverSupplierCreateSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "supplier.create");
      const id = await createSupplierRecord(prisma, { ...input, actor });
      return ok({ id });
    }
    if (command === "supplier.verify") {
      const input = serverVerificationSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "supplier.verify");
      await transitionSupplierVerification(prisma, { ...input, actor });
      return ok({ id: input.supplierId, status: input.status });
    }
    if (command === "supplier.pipeline") {
      const input = serverPipelineSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "supplier.pipeline.manage");
      await transitionSupplierPipeline(prisma, { ...input, actor });
      return ok({ id: input.supplierId, status: input.status });
    }
    if (command === "supplier.communication") {
      const input = serverCommunicationSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "outreach.log");
      const id = await logCommunicationRecord(
        prisma,
        {
          communication: {
            supplierId: input.supplierId, type: input.type, direction: input.direction,
            occurredAt: input.occurredAt, subject: input.subject, summary: input.summary,
            outcome: input.outcome, nextAction: input.nextAction,
          },
          actor,
        },
      );
      return ok({ id });
    }
    if (command === "supplier.followUp") {
      const input = serverFollowUpSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "followup.manage");
      const id = await scheduleFollowUpRecord(
        prisma,
        {
          followUp: {
            supplierId: input.supplierId, dueAt: input.dueAt, priority: input.priority,
            owner: input.owner, action: input.action, contactId: input.contactId,
          },
          actor,
        },
      );
      return ok({ id });
    }
    if (command === "supplier.updateProfile") {
      const input = serverSupplierProfileSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "supplier.update");
      const aggregate = await readSupplierAggregate(prisma, input.supplierId);
      if (!aggregate) return persistenceFailure("suppliers.updateProfile", { code: "P2025" });
      await prisma.supplier.update({
        where: { id: input.supplierId },
        data: {
          tradingName: input.tradingName ?? undefined,
          mineOrProjectName: input.mineOrProjectName ?? undefined,
          website: input.website ?? undefined,
          productionStatus: input.productionStatus ?? undefined,
          notes: input.notes ?? undefined,
        },
      });
      await prisma.supplierActivity.create({
        data: {
          id: `activity-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
          supplierId: input.supplierId, type: "SUPPLIER_CREATED",
          title: "Supplier profile updated", details: "Profile fields updated via server.",
          actorUserId: actor.id, actorName: actor.name,
        },
      });
      return ok({ id: input.supplierId });
    }
    return persistenceFailure("suppliers.unknown-command", new Error(`Unknown supplier command: ${command}`));
  } catch (error) {
    return persistenceFailure("suppliers.command", error);
  }
}
