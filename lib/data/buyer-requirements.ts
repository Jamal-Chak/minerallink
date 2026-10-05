import type { BuyerRequirement } from "../domain";

export const copperConcentrateRequirement: BuyerRequirement = {
  id: "req-copper-concentrate-001",
  buyerId: "buyer-001",

  title: "Copper Concentrate - China",

  commodity: "COPPER",
  productType: "CONCENTRATE",

  minimumGradePercent: 15,
  minimumSulphurPercent: 25,

  maximumImpurities: {
    arsenic: 0.3,
    chlorine: 0.5,
    cadmium: 0.05,
    mercury: 0.01,
    fluorine: 0.1,
  },

  maximumLeadPlusZincPercent: 6,

  acceptedMineralForms: [
    "SULPHIDE",
    "OXIDE",
  ],

  maximumParticleSizeMm: 5,

  trialQuantityMinMt: 50,
  trialQuantityMaxMt: 100,

  monthlyQuantityMt: 5000,

  destinationCountry: "China",

  destinationPorts: [
    "Lianyungang Port",
    "Huangpu Port",
  ],

  incoterms: [
    "CIF",
    "FOB",
  ],

  paymentMethods: [
    "TT",
    "DLC",
  ],

  inspectionAgencies: [
    "SGS",
    "CCIC",
  ],

  active: true,

  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};
