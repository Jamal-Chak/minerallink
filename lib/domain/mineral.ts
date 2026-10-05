export const COMMODITIES = [
  "COPPER",
  "LEAD",
  "ZINC",
  "NICKEL",
] as const;

export type Commodity = (typeof COMMODITIES)[number];

export const PRODUCT_TYPES = [
  "ORE",
  "CONCENTRATE",
  "SLAG",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export interface MineralImpurities {
  arsenic?: number;
  chlorine?: number;
  cadmium?: number;
  mercury?: number;
  fluorine?: number;
  lead?: number;
  zinc?: number;
}

export interface MineralSpecification {
  commodity: Commodity;
  productType: ProductType;
  gradePercent: number;
  mineralForm?: MineralForm;
  sulphurPercent?: number;
  impurities: MineralImpurities;
  particleSizeMm?: number;
}

export interface MineralProduct {
  id: string;
  supplierId: string;
  name: string;
  specification: MineralSpecification;

  availableQuantityMt?: number;
  monthlyCapacityMt?: number;
  trialQuantityMt?: number;

  loadingCountry: string;
  loadingLocation?: string;
  availableForExport: boolean;

  createdAt: string;
  updatedAt: string;
}
export const MINERAL_FORMS = [
  "SULPHIDE",
  "OXIDE",
  "MIXED",
  "UNKNOWN",
] as const;

export type MineralForm = (typeof MINERAL_FORMS)[number];


