// Phase 7 — product + assay mapping (pure; structural Prisma row shapes).
import type { MineralProduct } from "@/lib/domain";
import type { SupplierAssay } from "@/lib/domain/supplier-workflow";
import { assertId, fromDecimal, optionalText, toDecimalString, type WithDecimalCols } from "./decimal-mapping";

export interface PrismaProductRow {
  id: string;
  supplierId: string;
  name: string;
  commodity: MineralProduct["specification"]["commodity"];
  productType: MineralProduct["specification"]["productType"];
  specification: unknown;
  mineralForm: MineralProduct["specification"]["mineralForm"] | null;
  availableQuantityMt: string | null;
  monthlyCapacityMt: string | null;
  trialQuantityMt: string | null;
  loadingCountry: string;
  loadingLocation: string | null;
  availableForExport: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function mapProductToPrisma(product: MineralProduct): Omit<PrismaProductRow, "createdAt" | "updatedAt"> {
  assertId(product.id, "product id");
  const dec = (v: number | undefined) => toDecimalString(v) ?? null;
  return {
    id: product.id,
    supplierId: product.supplierId,
    name: product.name,
    commodity: product.specification.commodity,
    productType: product.specification.productType,
    specification: { ...product.specification, impurities: { ...product.specification.impurities } },
    mineralForm: product.specification.mineralForm ?? null,
    availableQuantityMt: dec(product.availableQuantityMt),
    monthlyCapacityMt: dec(product.monthlyCapacityMt),
    trialQuantityMt: dec(product.trialQuantityMt),
    loadingCountry: product.loadingCountry,
    loadingLocation: product.loadingLocation ?? null,
    availableForExport: product.availableForExport,
  };
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaProductReadRow = WithDecimalCols<PrismaProductRow, "availableQuantityMt" | "monthlyCapacityMt" | "trialQuantityMt">;

export function mapPrismaToProduct(row: PrismaProductReadRow): MineralProduct {
  const spec = (row.specification ?? {}) as MineralProduct["specification"];
  return {
    id: row.id,
    supplierId: row.supplierId,
    name: row.name,
    specification: {
      commodity: spec.commodity ?? row.commodity,
      productType: spec.productType ?? row.productType,
      mineralForm: spec.mineralForm ?? row.mineralForm ?? undefined,
      gradePercent: spec.gradePercent ?? 0,
      sulphurPercent: spec.sulphurPercent,
      impurities: spec.impurities ?? {},
      particleSizeMm: spec.particleSizeMm,
    },
    availableQuantityMt: fromDecimal(row.availableQuantityMt),
    monthlyCapacityMt: fromDecimal(row.monthlyCapacityMt),
    trialQuantityMt: fromDecimal(row.trialQuantityMt),
    loadingCountry: row.loadingCountry,
    loadingLocation: optionalText(row.loadingLocation),
    availableForExport: row.availableForExport,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface PrismaAssayRow {
  id: string;
  productId: string;
  source: SupplierAssay["source"];
  gradePercent: string;
  sulphurPercent: string | null;
  arsenicPercent: string | null;
  chlorinePercent: string | null;
  cadmiumPercent: string | null;
  mercuryPercent: string | null;
  fluorinePercent: string | null;
  leadPercent: string | null;
  zincPercent: string | null;
  particleSizeMm: string | null;
  laboratoryName: string | null;
  certificateRef: string | null;
  testedAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaAssayReadRow = WithDecimalCols<PrismaAssayRow, "gradePercent" | "sulphurPercent" | "arsenicPercent" | "chlorinePercent" | "cadmiumPercent" | "mercuryPercent" | "fluorinePercent" | "leadPercent" | "zincPercent" | "particleSizeMm">;
