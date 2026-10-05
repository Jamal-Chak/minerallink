import type {
  Commodity,
  MineralImpurities,
  ProductType,
  MineralForm,
} from "./mineral";

export type Incoterm = "FOB" | "CIF";

export type PaymentMethod = "TT" | "DLC";

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  title: string;

  commodity: Commodity;
  productType: ProductType;

  minimumGradePercent: number;
  minimumSulphurPercent?: number;

  maximumImpurities: MineralImpurities;
  maximumLeadPlusZincPercent?: number;
  acceptedMineralForms?: MineralForm[];
  maximumParticleSizeMm?: number;

  trialQuantityMinMt?: number;
  trialQuantityMaxMt?: number;
  monthlyQuantityMt: number;

  destinationCountry: string;
  destinationPorts: string[];

  incoterms: Incoterm[];
  paymentMethods: PaymentMethod[];
  inspectionAgencies: string[];

  active: boolean;

  createdAt: string;
  updatedAt: string;
}

