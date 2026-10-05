import { copperConcentrateRequirement } from "@/lib/data/buyer-requirements";
import type { BuyerRequirement, Deal, MineralProduct, Supplier } from "@/lib/domain";
import {
  failingCopperSupplier,
  incompleteCopperSupplier,
  matchingCopperSupplier,
} from "@/lib/data/sample-products";
import { matchMineralProduct } from "@/lib/matching";

export const supplierProfiles: Supplier[] = [
  {
    id: "supplier-match",
    companyName: "Copperbelt Minerals Zambia",
    tradingName: "Copperbelt Minerals",
    country: "Zambia",
    supplierType: "PRODUCER",
    productionStatus: "OPERATING",
    verificationStatus: "VERIFIED",
    pipelineStatus: "QUALIFIED",
    mineOrProjectName: "Copperbelt Mine",
    website: "https://www.copperbeltminerals.zm",
    contacts: [
      {
        id: "contact-match-1",
        name: "Nandipa Mumba",
        jobTitle: "Commercial Manager",
        email: "nandipa@copperbeltminerals.zm",
        phone: "+260 977 123 456",
        isPrimary: true,
      },
    ],
    notes:
      "Long-term concentrate producer with established export channels and consistent monthly output.",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "supplier-fail",
    companyName: "Kafue Copper Holdings",
    tradingName: "Kafue Copper",
    country: "Zambia",
    supplierType: "PRODUCER",
    productionStatus: "OPERATING",
    verificationStatus: "UNDER_REVIEW",
    pipelineStatus: "UNDER_VERIFICATION",
    mineOrProjectName: "Kafue Basin Project",
    website: "https://www.kafuecopper.com",
    contacts: [
      {
        id: "contact-fail-1",
        name: "Tapiwa Chisenga",
        jobTitle: "Operations Lead",
        email: "tapiwa@kafuecopper.com",
        phone: "+260 969 482 772",
        isPrimary: true,
      },
    ],
    notes:
      "Production is active but impurity profile does not satisfy the current buyer requirement thresholds.",
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
  },
  {
    id: "supplier-incomplete",
    companyName: "Lusaka Resource Partners",
    country: "Democratic Republic of the Congo",
    supplierType: "PRODUCER",
    productionStatus: "OPERATING",
    verificationStatus: "UNDER_REVIEW",
    pipelineStatus: "DOCUMENTS_REQUESTED",
    mineOrProjectName: "Katanga East Project",
    notes:
      "Export-ready but assay and document package are incomplete for full qualification.",
    contacts: [
      {
        id: "contact-partial-1",
        name: "Amelia Jojo",
        jobTitle: "Supply Chain Analyst",
        email: "amelia@lusakaresources.com",
        phone: "+243 820 019 993",
        isPrimary: true,
      },
    ],
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "supplier-amber",
    companyName: "Amber Ridge Mining",
    country: "South Africa",
    supplierType: "MINE",
    productionStatus: "DEVELOPMENT",
    verificationStatus: "UNVERIFIED",
    pipelineStatus: "NEW",
    mineOrProjectName: "Amber Ridge Prospect",
    notes:
      "Emerging project with potential copper output; due diligence and assay package still pending.",
    contacts: [
      {
        id: "contact-amber-1",
        name: "Mpho Ndlovu",
        jobTitle: "Business Development",
        email: "mpho@amberridgemining.co.za",
        phone: "+27 87 456 9111",
        isPrimary: true,
      },
    ],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  },
];

export const supplierProducts: Record<string, MineralProduct[]> = {
  "supplier-match": [matchingCopperSupplier],
  "supplier-fail": [failingCopperSupplier],
  "supplier-incomplete": [incompleteCopperSupplier],
  "supplier-amber": [
    {
      id: "product-copper-amber",
      supplierId: "supplier-amber",
      name: "Copper Ore",
      specification: {
        commodity: "COPPER",
        productType: "ORE",
        mineralForm: "SULPHIDE",
        gradePercent: 11.2,
        sulphurPercent: 22.6,
        impurities: {
          arsenic: 0.34,
          chlorine: 0.23,
          cadmium: 0.041,
          mercury: 0.008,
          fluorine: 0.11,
          lead: 2.4,
          zinc: 1.8,
        },
        particleSizeMm: 9,
      },
      availableQuantityMt: 1800,
      monthlyCapacityMt: 4200,
      trialQuantityMt: 25,
      loadingCountry: "South Africa",
      loadingLocation: "Johannesburg rail terminal",
      availableForExport: true,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-04T00:00:00.000Z",
    },
  ],
};

export const leadConcentrateRequirement: BuyerRequirement = {
  id: "req-lead-concentrate-002",
  buyerId: "buyer-002",
  title: "Lead Concentrate - China",
  commodity: "LEAD",
  productType: "CONCENTRATE",
  minimumGradePercent: 52,
  minimumSulphurPercent: 18,
  maximumImpurities: {
    arsenic: 0.8,
    chlorine: 0.7,
    cadmium: 0.15,
    mercury: 0.05,
    fluorine: 0.2,
  },
  maximumLeadPlusZincPercent: 10,
  acceptedMineralForms: ["SULPHIDE", "MIXED"],
  maximumParticleSizeMm: 6,
  trialQuantityMinMt: 40,
  trialQuantityMaxMt: 120,
  monthlyQuantityMt: 3500,
  destinationCountry: "China",
  destinationPorts: ["Qingdao Port", "Shanghai Port"],
  incoterms: ["FOB", "CIF"],
  paymentMethods: ["TT", "DLC"],
  inspectionAgencies: ["SGS", "CCIC"],
  active: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

export const buyerRequirements: BuyerRequirement[] = [
  copperConcentrateRequirement,
  leadConcentrateRequirement,
];

export const pipelineSummary = {
  NEW: 12,
  CONTACTED: 8,
  RESPONDED: 6,
  DOCUMENTS_REQUESTED: 9,
  UNDER_VERIFICATION: 14,
  QUALIFIED: 7,
  REJECTED: 3,
};

export const recentActivity = [
  {
    id: "activity-1",
    title: "Copperbelt Minerals Zambia",
    details: "Updated assay package and renewed export documentation.",
    time: "2 hours ago",
  },
  {
    id: "activity-2",
    title: "Kafue Copper Holdings",
    details: "Verification review requested for impurity thresholds.",
    time: "Yesterday",
  },
  {
    id: "activity-3",
    title: "Lusaka Resource Partners",
    details: "Documents requested from buyer requirement desk.",
    time: "2 days ago",
  },
  {
    id: "activity-4",
    title: "Amber Ridge Mining",
    details: "New supplier introduced to the pipeline.",
    time: "3 days ago",
  },
];

export const supplyOverview = {
  Copper: {
    suppliers: 9,
    capacity: 18600,
    qualified: 6200,
  },
  Lead: {
    suppliers: 5,
    capacity: 9200,
    qualified: 3500,
  },
  Zinc: {
    suppliers: 7,
    capacity: 14600,
    qualified: 4700,
  },
  Nickel: {
    suppliers: 3,
    capacity: 4800,
    qualified: 1200,
  },
};

export const verificationChecklist = [
  { id: "company-registration", label: "Company registration", status: "VERIFIED" },
  { id: "mining-licence", label: "Mining licence", status: "VERIFIED" },
  { id: "export-licence", label: "Export licence", status: "PENDING" },
  { id: "assay-certificate", label: "Assay certificate", status: "VERIFIED" },
  { id: "inspection-report", label: "SGS/CCIC inspection", status: "PENDING" },
  { id: "product-photos", label: "Product photos", status: "MISSING" },
  { id: "stock-evidence", label: "Stock evidence", status: "VERIFIED" },
  { id: "project-verification", label: "Mine/project verification", status: "VERIFIED" },
  { id: "contact-verification", label: "Contact verification", status: "VERIFIED" },
] satisfies {
  id: string;
  label: string;
  status: "VERIFIED" | "PENDING" | "MISSING" | "REJECTED";
}[];

export const dealRecords: Deal[] = [
  {
    id: "deal-001",
    buyerId: "buyer-001",
    supplierId: "supplier-match",
    requirementId: "req-copper-concentrate-001",
    productId: "product-copper-match",
    status: "ACTIVE_CONTRACT",
    quantityMt: 3500,
    currency: "USD",
    pricePerMt: 185,
    commissionPercent: 1.8,
    commissionAmount: 11550,
    notes: "Trial shipment completed and contract in production stage.",
    createdAt: "2026-09-18T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "deal-002",
    buyerId: "buyer-001",
    supplierId: "supplier-incomplete",
    requirementId: "req-copper-concentrate-001",
    productId: "product-copper-incomplete",
    status: "QUALIFICATION",
    quantityMt: 2000,
    currency: "USD",
    pricePerMt: 172,
    commissionPercent: 1.5,
    commissionAmount: 5160,
    notes: "Document set still pending for full commercial review.",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "deal-003",
    buyerId: "buyer-002",
    supplierId: "supplier-fail",
    requirementId: "req-lead-concentrate-002",
    productId: "product-copper-fail",
    status: "NEGOTIATION",
    quantityMt: 1500,
    currency: "USD",
    pricePerMt: 164,
    commissionPercent: 1.2,
    commissionAmount: 2952,
    notes: "Supplier profile remains below buyer grade thresholds.",
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
];

export function getSupplierById(supplierId: string): Supplier | undefined {
  return supplierProfiles.find((supplier) => supplier.id === supplierId);
}

export function getMatchResultForSupplier(supplierId: string) {
  const supplier = getSupplierById(supplierId);
  const product = supplierProducts[supplierId]?.[0];

  if (!supplier || !product) {
    return null;
  }

  return {
    supplier,
    product,
    result: matchMineralProduct(product, copperConcentrateRequirement),
  };
}
