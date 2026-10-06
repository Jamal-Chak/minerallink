// Phase 7 — deal mapping part 1: deal row, commercial terms, negotiations,
// buyer introduction. Pure functions; structural Prisma rows (no client import).
//
// Match snapshots (`matchResult` JSON) are immutable evidence: written once on
// deal creation when present, never recomputed or overwritten by the server.
import type { Deal } from "@/lib/domain";
import type {
  DealCommercialTerms,
  DealMetadata,
} from "@/lib/domain/deal-workflow";
import { assertId, fromDecimal, optionalText, toDecimalString, type WithDecimalCols } from "./decimal-mapping";

export interface PrismaDealRow {
  id: string; buyerId: string; supplierId: string; requirementId: string; productId: string;
  status: Deal["status"]; supplyType: DealMetadata["supplyType"]; destination: string | null;
  isDemoFixture: boolean; createdFromMatch: boolean;
  matchResult: unknown; matchEvidenceSource: string | null;
  quantityMt: string | null; currency: string | null;
  pricePerMt: string | null; commissionPercent: string | null;
  commissionAmount: string | null; notes: string | null;
  createdAt: Date; updatedAt: Date;
}

export function mapDealToPrisma(
  deal: Deal, metadata: DealMetadata | undefined,
): Omit<PrismaDealRow, "createdAt" | "updatedAt"> {
  assertId(deal.id, "deal id");
  const dec = (v: number | undefined) => toDecimalString(v) ?? null;
  return {
    id: deal.id, buyerId: deal.buyerId, supplierId: deal.supplierId,
    requirementId: deal.requirementId, productId: deal.productId, status: deal.status,
    supplyType: metadata?.supplyType ?? "RECURRING",
    destination: metadata?.destination ?? null,
    isDemoFixture: metadata?.isDemoFixture ?? false,
    createdFromMatch: metadata?.createdFromMatch ?? false,
    matchResult: (metadata?.matchResult ?? null) as unknown,
    matchEvidenceSource: metadata?.matchEvidenceSource ?? null,
    quantityMt: dec(deal.quantityMt), currency: deal.currency ?? null,
    pricePerMt: dec(deal.pricePerMt),
    commissionPercent: dec(deal.commissionPercent),
    commissionAmount: dec(deal.commissionAmount),
    notes: deal.notes ?? null,
  };
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaDealReadRow = WithDecimalCols<PrismaDealRow, "quantityMt" | "pricePerMt" | "commissionPercent" | "commissionAmount">;

export function mapPrismaToDeal(row: PrismaDealReadRow): { deal: Deal; metadata: DealMetadata } {
  const deal: Deal = {
    id: row.id, buyerId: row.buyerId, supplierId: row.supplierId,
    requirementId: row.requirementId, productId: row.productId, status: row.status,
    quantityMt: fromDecimal(row.quantityMt), currency: optionalText(row.currency),
    pricePerMt: fromDecimal(row.pricePerMt),
    commissionPercent: fromDecimal(row.commissionPercent),
    commissionAmount: fromDecimal(row.commissionAmount),
    notes: optionalText(row.notes),
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
  const metadata: DealMetadata = {
    isDemoFixture: row.isDemoFixture, supplyType: row.supplyType,
    destination: optionalText(row.destination),
    createdFromMatch: row.createdFromMatch,
    matchResult: (row.matchResult ?? undefined) as DealMetadata["matchResult"],
    matchEvidenceSource: optionalText(row.matchEvidenceSource),
  };
  return { deal, metadata };
}

export interface PrismaCommercialTermsRow {
  dealId: string;
  quantityMt: string | null; pricePerMt: string | null;
  currency: string | null; incoterm: DealCommercialTerms["incoterm"] | null;
  loadingLocation: string | null; destinationPort: string | null;
  inspectionAgency: DealCommercialTerms["inspectionAgency"] | null;
  paymentMethod: DealCommercialTerms["paymentMethod"] | null;
  paymentTerms: string | null; offerValidity: string | null; deliverySchedule: string | null;
  packing: string | null; particleSizeMm: string | null;
  commercialNotes: string | null; valueState: DealCommercialTerms["valueState"];
}

export function mapTermsToPrisma(dealId: string, terms: DealCommercialTerms): PrismaCommercialTermsRow {
  return {
    dealId,
    quantityMt: toDecimalString(terms.quantityMt) ?? null,
    pricePerMt: toDecimalString(terms.pricePerMt) ?? null,
    currency: terms.currency ?? null, incoterm: terms.incoterm ?? null,
    loadingLocation: terms.loadingLocation ?? null, destinationPort: terms.destinationPort ?? null,
    inspectionAgency: terms.inspectionAgency ?? null, paymentMethod: terms.paymentMethod ?? null,
    paymentTerms: terms.paymentTerms ?? null, offerValidity: terms.offerValidity ?? null,
    deliverySchedule: terms.deliverySchedule ?? null, packing: terms.packing ?? null,
    particleSizeMm: toDecimalString(terms.particleSizeMm) ?? null,
    commercialNotes: terms.commercialNotes ?? null, valueState: terms.valueState,
  };
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaCommercialTermsReadRow = WithDecimalCols<PrismaCommercialTermsRow, "quantityMt" | "pricePerMt" | "particleSizeMm">;

export function mapPrismaToTerms(row: PrismaCommercialTermsReadRow, updatedAt: string): DealCommercialTerms {
  return {
    quantityMt: fromDecimal(row.quantityMt), pricePerMt: fromDecimal(row.pricePerMt),
    currency: optionalText(row.currency), incoterm: row.incoterm ?? undefined,
    loadingLocation: optionalText(row.loadingLocation), destinationPort: optionalText(row.destinationPort),
    inspectionAgency: row.inspectionAgency ?? undefined, paymentMethod: row.paymentMethod ?? undefined,
    paymentTerms: optionalText(row.paymentTerms), offerValidity: optionalText(row.offerValidity),
    deliverySchedule: optionalText(row.deliverySchedule), packing: optionalText(row.packing),
    particleSizeMm: fromDecimal(row.particleSizeMm),
    commercialNotes: optionalText(row.commercialNotes), valueState: row.valueState, updatedAt,
  };
}
