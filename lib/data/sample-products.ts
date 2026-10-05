import type { MineralProduct } from "../domain";

export const matchingCopperSupplier: MineralProduct = {
  id: "product-copper-match",
  supplierId: "supplier-match",
  name: "Copper Concentrate",

  specification: {
    commodity: "COPPER",
    productType: "CONCENTRATE",
    mineralForm: "SULPHIDE",

    gradePercent: 18.4,
    sulphurPercent: 27.1,

    impurities: {
      arsenic: 0.21,
      chlorine: 0.18,
      cadmium: 0.03,
      mercury: 0.005,
      fluorine: 0.07,
      lead: 1.5,
      zinc: 2.1,
    },

    particleSizeMm: 4,
  },

  availableQuantityMt: 7500,
  monthlyCapacityMt: 7500,
  trialQuantityMt: 100,

  loadingCountry: "Zambia",
  loadingLocation: "Copperbelt",

  availableForExport: true,

  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

export const failingCopperSupplier: MineralProduct = {
  id: "product-copper-fail",
  supplierId: "supplier-fail",
  name: "Copper Concentrate",

  specification: {
    commodity: "COPPER",
    productType: "CONCENTRATE",
    mineralForm: "SULPHIDE",

    gradePercent: 13,
    sulphurPercent: 21,

    impurities: {
      arsenic: 0.42,
      chlorine: 0.2,
      cadmium: 0.03,
      mercury: 0.005,
      fluorine: 0.07,
      lead: 4,
      zinc: 3,
    },

    particleSizeMm: 6,
  },

  monthlyCapacityMt: 3000,

  loadingCountry: "Zambia",
  availableForExport: true,

  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

export const incompleteCopperSupplier: MineralProduct = {
  id: "product-copper-incomplete",
  supplierId: "supplier-incomplete",
  name: "Copper Concentrate",

  specification: {
    commodity: "COPPER",
    productType: "CONCENTRATE",
    mineralForm: "SULPHIDE",

    gradePercent: 17,
    sulphurPercent: 26,

    impurities: {
      arsenic: 0.2,
      chlorine: 0.2,
    },

    particleSizeMm: 4,
  },

  monthlyCapacityMt: 6000,

  loadingCountry: "DRC",
  availableForExport: true,

  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};
