// Phase 7 — deal command boundary (server-only).
// POST /api/workspace/deals/commands { command, payload }
import { prisma } from "@/lib/db";
import { ok, persistenceFailure, readSessionCookie, serverActorFromCookie } from "@/lib/repositories/server-route-helpers";
import {
  serverCommissionSchema,
  serverDealCreateSchema,
  serverDealStageSchema,
  serverPaymentSchema,
  serverShipmentSchema,
} from "@/lib/repositories/prisma/server-commands";
import { createDealRecord, transitionDealStage } from "@/lib/repositories/prisma-deal-operations";
import { saveCommercialTermsRecord } from "@/lib/repositories/prisma-deal-commercial-operations";
import { createPaymentMilestoneRecord, createShipmentRecord, saveCommissionRecord } from "@/lib/repositories/prisma-deal-logistics-operations";
import { z } from "zod";

export const dynamic = "force-dynamic";

const commandSchema = z.object({ command: z.string().min(1), payload: z.unknown() });

export async function POST(request: Request): Promise<Response> {
  try {
    const cookie = readSessionCookie(request);
    const body = (await request.json().catch(() => null)) as { command?: string; payload?: unknown } | null;
    const parsed = commandSchema.safeParse(body);
    if (!parsed.success) return persistenceFailure("deals.parse", parsed.error);
    const { command, payload } = parsed.data;

    if (command === "deal.create") {
      const input = serverDealCreateSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "deal.create");
      const id = await createDealRecord(prisma, { ...input, actor });
      return ok({ id });
    }
    if (command === "deal.stage") {
      const input = serverDealStageSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "deal.stage.manage");
      await transitionDealStage(prisma, { ...input, actor });
      return ok({ id: input.dealId, status: input.status });
    }
    if (command === "deal.shipment") {
      const input = serverShipmentSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "shipment.manage");
      const id = await createShipmentRecord(
        prisma,
        {
          shipment: {
            dealId: input.dealId, plannedQuantityMt: input.plannedQuantityMt,
            loadingLocation: input.loadingLocation, destinationPort: input.destinationPort,
            status: input.status, billOfLadingReference: input.billOfLadingReference,
            notes: input.notes,
          },
          actor,
        },
      );
      return ok({ id });
    }
    if (command === "deal.payment") {
      const input = serverPaymentSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "payment.manage");
      const id = await createPaymentMilestoneRecord(
        prisma,
        {
          payment: {
            dealId: input.dealId, milestone: input.milestone,
            expectedPercentage: input.expectedPercentage, expectedAmount: input.expectedAmount,
            currency: input.currency, dueDate: input.dueDate, status: input.status,
            reference: input.reference, notes: input.notes,
          },
          actor,
        },
      );
      return ok({ id });
    }
    if (command === "deal.commission") {
      const input = serverCommissionSchema.parse(payload);
      const actor = serverActorFromCookie(cookie, "commission.edit");
      await saveCommissionRecord(
        prisma,
        {
          commission: {
            dealId: input.dealId, type: input.type, percentage: input.percentage,
            fixedAmount: input.fixedAmount, currency: input.currency, status: input.status,
          },
          actor,
        },
      );
      return ok({ id: input.dealId });
    }
    if (command === "deal.commercialTerms") {
      const { commercialTermsSchema } = await import("@/lib/validation/deal-schemas");
      const values = commercialTermsSchema.parse(payload) as {
        quantityMt?: number; pricePerMt?: number; currency?: string;
        incoterm?: "FOB" | "CIF"; valueState: "INDICATIVE" | "AGREED" | "ACTUAL";
      };
      const base = z.object({ dealId: z.string().min(1).max(300) }).parse(payload);
      const actor = serverActorFromCookie(cookie, "commercial.edit");
      await saveCommercialTermsRecord(prisma, { dealId: base.dealId, terms: values, actor });
      return ok({ id: base.dealId });
    }
    return persistenceFailure("deals.unknown-command", new Error(`Unknown deal command: ${command}`));
  } catch (error) {
    return persistenceFailure("deals.command", error);
  }
}
