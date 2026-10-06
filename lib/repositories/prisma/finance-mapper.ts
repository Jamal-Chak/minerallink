// Phase 7 — deal finance mapping: payments, commissions, activities (pure).
import type {
  DealActivity,
  DealCommission,
  DealPaymentMilestone,
} from "@/lib/domain/deal-workflow";
import { assertId, fromDecimal, optionalText, toDecimalString, type WithDecimalCols } from "./decimal-mapping";

export interface PrismaPaymentRow {
  id: string; dealId: string; milestone: string;
  expectedPercentage: string | null;
  expectedAmount: string | null;
  currency: string | null; dueDate: string | null;
  status: DealPaymentMilestone["status"]; reference: string | null; notes: string | null;
  createdAt: Date; updatedAt: Date;
}

export function mapPaymentToPrisma(p: DealPaymentMilestone): Omit<PrismaPaymentRow, "createdAt" | "updatedAt"> {
  assertId(p.id, "payment id");
  return {
    id: p.id, dealId: p.dealId, milestone: p.milestone,
    expectedPercentage: toDecimalString(p.expectedPercentage) ?? null,
    expectedAmount: toDecimalString(p.expectedAmount) ?? null,
    currency: p.currency ?? null, dueDate: p.dueDate ?? null,
    status: p.status, reference: p.reference ?? null, notes: p.notes ?? null,
  };
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaPaymentReadRow = WithDecimalCols<PrismaPaymentRow, "expectedPercentage" | "expectedAmount">;

export function mapPrismaToPayment(row: PrismaPaymentReadRow): DealPaymentMilestone {
  return {
    id: row.id, dealId: row.dealId, milestone: row.milestone,
    expectedPercentage: fromDecimal(row.expectedPercentage),
    expectedAmount: fromDecimal(row.expectedAmount),
    currency: optionalText(row.currency), dueDate: optionalText(row.dueDate),
    status: row.status, reference: optionalText(row.reference), notes: optionalText(row.notes),
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

export interface PrismaCommissionRow {
  dealId: string; type: DealCommission["type"];
  percentage: string | null; fixedAmount: string | null;
  currency: string | null; status: DealCommission["status"];
}

export function mapCommissionToPrisma(c: DealCommission): PrismaCommissionRow {
  assertId(c.dealId, "deal id");
  return {
    dealId: c.dealId, type: c.type,
    percentage: toDecimalString(c.percentage) ?? null,
    fixedAmount: toDecimalString(c.fixedAmount) ?? null,
    currency: c.currency ?? null, status: c.status,
  };
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaCommissionReadRow = WithDecimalCols<PrismaCommissionRow, "percentage" | "fixedAmount">;

export function mapPrismaToCommission(row: PrismaCommissionReadRow, updatedAt: string): DealCommission {
  return {
    dealId: row.dealId, type: row.type,
    percentage: fromDecimal(row.percentage), fixedAmount: fromDecimal(row.fixedAmount),
    currency: optionalText(row.currency), status: row.status, updatedAt,
  };
}

export interface PrismaDealActivityRow {
  id: string; dealId: string; type: DealActivity["type"]; title: string; details: string;
  actorUserId: string | null; actorName: string | null; createdAt: Date;
}

export function mapDealActivityToPrisma(a: DealActivity): Omit<PrismaDealActivityRow, "createdAt"> {
  assertId(a.id, "deal activity id");
  return {
    id: a.id, dealId: a.dealId, type: a.type, title: a.title, details: a.details,
    actorUserId: a.actorUserId ?? null, actorName: a.actorName ?? null,
  };
}

export function mapPrismaToDealActivity(row: PrismaDealActivityRow): DealActivity {
  return {
    id: row.id, dealId: row.dealId, type: row.type, title: row.title, details: row.details,
    actorUserId: optionalText(row.actorUserId), actorName: optionalText(row.actorName),
    createdAt: row.createdAt.toISOString(),
  };
}
