import "dotenv/config";

import {
  AssaySource,
  Commodity,
  Incoterm,
  MineralForm,
  PaymentMethod,
  ProductType,
  ProductionStatus,
  SupplierPipelineStatus,
  SupplierType,
  VerificationStatus,
} from "../lib/generated/prisma/client";

import { prisma } from "../lib/db";

async function main() {
  console.log("Seeding MineralLink...");

  // Keep development seeding repeatable.
  await prisma.deal.deleteMany();
  await prisma.assay.deleteMany();
  await prisma.mineralProduct.deleteMany();
  await prisma.supplierDocument.deleteMany();
  await prisma.supplierContact.deleteMany();
  await prisma.buyerRequirement.deleteMany();
  await prisma.buyerContact.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.buyer.deleteMany();

  const buyer = await prisma.buyer.create({
    data: {
      companyName: "MineralLink Commercial Buyer",
      country: "China",
      verificationStatus: VerificationStatus.UNDER_REVIEW,
      notes:
        "Development buyer record representing the commercial mineral purchasing mandate.",
    },
  });

  const copperRequirement = await prisma.buyerRequirement.create({
    data: {
      buyerId: buyer.id,
      title: "Copper Concentrate - China",

      commodity: Commodity.COPPER,
      productType: ProductType.CONCENTRATE,

      minimumGradePercent: 15,
      minimumSulphurPercent: 25,

      maxArsenicPercent: 0.3,
      maxChlorinePercent: 0.5,
      maxCadmiumPercent: 0.05,
      maxMercuryPercent: 0.01,
      maxFluorinePercent: 0.1,
      maxLeadPlusZincPercent: 6,

      maximumParticleSizeMm: 5,

      acceptedMineralForms: [
        MineralForm.SULPHIDE,
        MineralForm.OXIDE,
      ],

      trialQuantityMinMt: 50,
      trialQuantityMaxMt: 100,
      monthlyQuantityMt: 5000,

      destinationCountry: "China",
      destinationPorts: [
        "Lianyungang Port",
        "Huangpu Port",
      ],

      incoterms: [
        Incoterm.CIF,
        Incoterm.FOB,
      ],

      paymentMethods: [
        PaymentMethod.TT,
        PaymentMethod.DLC,
      ],

      inspectionAgencies: [
        "SGS",
        "CCIC",
      ],

      active: true,
    },
  });

  const matchingSupplier = await prisma.supplier.create({
    data: {
      companyName: "MineralLink Test Supplier - Matching",
      country: "Zambia",
      supplierType: SupplierType.PRODUCER,
      productionStatus: ProductionStatus.OPERATING,
      verificationStatus: VerificationStatus.VERIFIED,
      pipelineStatus: SupplierPipelineStatus.QUALIFIED,
      mineOrProjectName: "Copperbelt Test Operation",
      notes:
        "Development fixture designed to satisfy the copper concentrate mandate.",
      products: {
        create: {
          name: "Copper Concentrate",
          commodity: Commodity.COPPER,
          productType: ProductType.CONCENTRATE,
          mineralForm: MineralForm.SULPHIDE,
          availableQuantityMt: 10000,
          monthlyCapacityMt: 7500,
          trialQuantityMt: 100,
          loadingCountry: "Zambia",
          loadingLocation: "Copperbelt",
          availableForExport: true,
          assays: {
            create: {
              source: AssaySource.LABORATORY,
              gradePercent: 18.4,
              sulphurPercent: 27.1,
              arsenicPercent: 0.21,
              chlorinePercent: 0.18,
              cadmiumPercent: 0.03,
              mercuryPercent: 0.005,
              fluorinePercent: 0.07,
              leadPercent: 1.5,
              zincPercent: 2.1,
              particleSizeMm: 4,
              laboratoryName: "Development Test Laboratory",
              certificateRef: "ML-TEST-MATCH-001",
              testedAt: new Date("2026-09-15"),
              notes: "Synthetic assay data for matching-engine testing.",
            },
          },
        },
      },
    },
    include: {
      products: true,
    },
  });

  const failingSupplier = await prisma.supplier.create({
    data: {
      companyName: "MineralLink Test Supplier - Failing",
      country: "Zambia",
      supplierType: SupplierType.PRODUCER,
      productionStatus: ProductionStatus.OPERATING,
      verificationStatus: VerificationStatus.UNDER_REVIEW,
      pipelineStatus: SupplierPipelineStatus.UNDER_VERIFICATION,
      notes:
        "Development fixture intentionally outside several buyer specifications.",
      products: {
        create: {
          name: "Copper Concentrate",
          commodity: Commodity.COPPER,
          productType: ProductType.CONCENTRATE,
          mineralForm: MineralForm.SULPHIDE,
          availableQuantityMt: 4000,
          monthlyCapacityMt: 3000,
          loadingCountry: "Zambia",
          loadingLocation: "Copperbelt",
          availableForExport: true,
          assays: {
            create: {
              source: AssaySource.SUPPLIER,
              gradePercent: 13,
              sulphurPercent: 21,
              arsenicPercent: 0.42,
              chlorinePercent: 0.2,
              cadmiumPercent: 0.03,
              mercuryPercent: 0.005,
              fluorinePercent: 0.08,
              leadPercent: 4,
              zincPercent: 3,
              particleSizeMm: 6,
              certificateRef: "ML-TEST-FAIL-001",
              testedAt: new Date("2026-09-16"),
              notes: "Synthetic failing assay for matching-engine testing.",
            },
          },
        },
      },
    },
    include: {
      products: true,
    },
  });

  const incompleteSupplier = await prisma.supplier.create({
    data: {
      companyName: "MineralLink Test Supplier - Incomplete",
      country: "Democratic Republic of the Congo",
      supplierType: SupplierType.PRODUCER,
      productionStatus: ProductionStatus.OPERATING,
      verificationStatus: VerificationStatus.UNDER_REVIEW,
      pipelineStatus: SupplierPipelineStatus.DOCUMENTS_REQUESTED,
      notes:
        "Development fixture with incomplete assay and trial quantity information.",
      products: {
        create: {
          name: "Copper Concentrate",
          commodity: Commodity.COPPER,
          productType: ProductType.CONCENTRATE,
          mineralForm: MineralForm.SULPHIDE,
          monthlyCapacityMt: 6000,
          loadingCountry: "Democratic Republic of the Congo",
          availableForExport: true,
          assays: {
            create: {
              source: AssaySource.SUPPLIER,
              gradePercent: 17,
              sulphurPercent: 26,
              arsenicPercent: 0.2,
              chlorinePercent: 0.2,
              particleSizeMm: 4,
              certificateRef: "ML-TEST-PARTIAL-001",
              testedAt: new Date("2026-09-17"),
              notes:
                "Synthetic incomplete assay for matching-engine testing.",
            },
          },
        },
      },
    },
    include: {
      products: true,
    },
  });

  console.log("MineralLink seed completed successfully.");
  console.log({
    buyer: buyer.companyName,
    requirement: copperRequirement.title,
    suppliers: [
      matchingSupplier.companyName,
      failingSupplier.companyName,
      incompleteSupplier.companyName,
    ],
  });
}

main()
  .catch((error) => {
    console.error("MineralLink seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

