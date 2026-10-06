// Phase 7 — deal workflow mapping part 2: negotiations, introduction,
// shipments, inspections, payments, commissions, activities. Pure functions.
import type {
  BuyerIntroduction,
  DealNegotiationRound,
} from "@/lib/domain/deal-workflow";
import { assertId, fromDecimal, optionalText, toDecimalString, type WithDecimalCols } from "./decimal-mapping";

export interface PrismaNegotiationRow {
  id: string; dealId: string; date: string; party: DealNegotiationRound["party"];
  quantityMt: string | null; pricePerMt: string | null;
  currency: string | null; incoterm: DealNegotiationRound["incoterm"] | null;
  paymentMethod: DealNegotiationRound["paymentMethod"] | null;
  paymentTerms: string | null; destination: string | null; comments: string | null;
  createdAt: Date;
}

export function mapNegotiationToPrisma(r: DealNegotiationRound): Omit<PrismaNegotiationRow, "createdAt"> {
  assertId(r.id, "negotiation id");
  return {
    id: r.id, dealId: r.dealId, date: r.date, party: r.party,
    quantityMt: toDecimalString(r.quantityMt) ?? null,
    pricePerMt: toDecimalString(r.pricePerMt) ?? null,
    currency: r.currency ?? null, incoterm: r.incoterm ?? null,
    paymentMethod: r.paymentMethod ?? null, paymentTerms: r.paymentTerms ?? null,
    destination: r.destination ?? null, comments: r.comments ?? null,
  };
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaNegotiationReadRow = WithDecimalCols<PrismaNegotiationRow, "quantityMt" | "pricePerMt">;

export function mapPrismaToNegotiation(row: PrismaNegotiationReadRow): DealNegotiationRound {
  return {
    id: row.id, dealId: row.dealId, date: row.date, party: row.party,
    quantityMt: fromDecimal(row.quantityMt), pricePerMt: fromDecimal(row.pricePerMt),
    currency: optionalText(row.currency), incoterm: row.incoterm ?? undefined,
    paymentMethod: row.paymentMethod ?? undefined, paymentTerms: optionalText(row.paymentTerms),
    destination: optionalText(row.destination), comments: optionalText(row.comments),
    createdAt: row.createdAt.toISOString(),
  };
}

export interface PrismaIntroductionRow {
  id: string; dealId: string; introducedAt: string;
  supplierContactId: string | null; buyerContactName: string | null;
  buyerContactEmail: string | null; requirementId: string;
  introducedBy: string; internalNotes: string | null; createdAt: Date;
}

export function mapIntroductionToPrisma(i: BuyerIntroduction): Omit<PrismaIntroductionRow, "createdAt"> {
  assertId(i.id, "introduction id");
  return {
    id: i.id, dealId: i.dealId, introducedAt: i.introducedAt,
    supplierContactId: i.supplierContactId ?? null,
    buyerContactName: i.buyerContactName ?? null,
    buyerContactEmail: i.buyerContactEmail ?? null,
    requirementId: i.requirementId, introducedBy: i.introducedBy,
    internalNotes: i.internalNotes ?? null,
  };
}

export function mapPrismaToIntroduction(row: PrismaIntroductionRow): BuyerIntroduction {
  return {
    id: row.id, dealId: row.dealId, introducedAt: row.introducedAt,
    supplierContactId: optionalText(row.supplierContactId),
    buyerContactName: optionalText(row.buyerContactName),
    buyerContactEmail: optionalText(row.buyerContactEmail),
    requirementId: row.requirementId, introducedBy: row.introducedBy,
    internalNotes: optionalText(row.internalNotes),
    createdAt: row.createdAt.toISOString(),
  };
}
