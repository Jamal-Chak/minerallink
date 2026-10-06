// Phase 7 — Supplier domain <-> Prisma mapping (part 1: row shapes + supplier).
// Pure functions only: no Prisma client import, no I/O. Decimal values cross
// as exact strings; timestamps as ISO strings in the domain, Date server-side.
//
// Representational differences (browser -> Prisma):
// - contacts embedded in domain, SupplierContact rows in Prisma (join on read)
// - workflow metadata + outreach status live on the Supplier row itself
// - verification checks: domain id is the stable check key; Prisma row id is
//   `${supplierId}:${checkKey}`, domain id carried in `checkKey`
// - SupplierDocument.fileUrl has no domain counterpart (always null server-side)
// - Assay rows carry no supplierId; derived through the product on read.
import type { Supplier, SupplierContact } from "@/lib/domain";
import type {
  SupplierOutreachStatus,
  SupplierWorkflowMetadata,
} from "@/lib/domain/supplier-workflow";
import { assertId, optionalText } from "./decimal-mapping";

export interface PrismaSupplierRow {
  id: string;
  companyName: string;
  tradingName: string | null;
  country: string;
  supplierType: Supplier["supplierType"];
  productionStatus: Supplier["productionStatus"];
  verificationStatus: Supplier["verificationStatus"];
  pipelineStatus: Supplier["pipelineStatus"];
  mineOrProjectName: string | null;
  website: string | null;
  notes: string | null;
  outreachStatus: SupplierOutreachStatus;
  source: string;
  isDemoFixture: boolean;
  supplyCountry: string | null;
  loadingLocation: string | null;
  availableForExport: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrismaSupplierContactRow {
  id: string;
  supplierId: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

export interface SupplierPrismaPayload {
  supplier: Omit<PrismaSupplierRow, "createdAt" | "updatedAt">;
  contacts: PrismaSupplierContactRow[];
}

export function mapSupplierToPrisma(
  supplier: Supplier,
  metadata: SupplierWorkflowMetadata | undefined,
  outreachStatus: SupplierOutreachStatus | undefined,
): SupplierPrismaPayload {
  assertId(supplier.id, "supplier id");
  return {
    supplier: {
      id: supplier.id,
      companyName: supplier.companyName,
      tradingName: supplier.tradingName ?? null,
      country: supplier.country,
      supplierType: supplier.supplierType,
      productionStatus: supplier.productionStatus,
      verificationStatus: supplier.verificationStatus,
      pipelineStatus: supplier.pipelineStatus,
      mineOrProjectName: supplier.mineOrProjectName ?? null,
      website: supplier.website ?? null,
      notes: supplier.notes ?? null,
      outreachStatus: outreachStatus ?? "NOT_CONTACTED",
      source: metadata?.source ?? "Unspecified",
      isDemoFixture: metadata?.isDemoFixture ?? false,
      supplyCountry: metadata?.supplyCountry ?? supplier.country,
      loadingLocation: metadata?.loadingLocation ?? null,
      availableForExport: metadata?.availableForExport ?? false,
    },
    contacts: supplier.contacts.map((contact) => mapContactToPrisma(supplier.id, contact)),
  };
}

export function mapContactToPrisma(supplierId: string, contact: SupplierContact): PrismaSupplierContactRow {
  assertId(contact.id, "contact id");
  return {
    id: contact.id,
    supplierId,
    name: contact.name,
    jobTitle: contact.jobTitle ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    isPrimary: contact.isPrimary,
  };
}

export function mapPrismaToSupplier(
  row: PrismaSupplierRow,
  contacts: PrismaSupplierContactRow[],
): { supplier: Supplier; metadata: SupplierWorkflowMetadata; outreachStatus: SupplierOutreachStatus } {
  const supplier: Supplier = {
    id: row.id,
    companyName: row.companyName,
    tradingName: optionalText(row.tradingName),
    country: row.country,
    supplierType: row.supplierType,
    productionStatus: row.productionStatus,
    verificationStatus: row.verificationStatus,
    pipelineStatus: row.pipelineStatus,
    mineOrProjectName: optionalText(row.mineOrProjectName),
    website: optionalText(row.website),
    contacts: contacts.map(
      (contact): SupplierContact => ({
        id: contact.id,
        name: contact.name,
        jobTitle: optionalText(contact.jobTitle),
        email: optionalText(contact.email),
        phone: optionalText(contact.phone),
        isPrimary: contact.isPrimary,
      }),
    ),
    notes: optionalText(row.notes),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  const metadata: SupplierWorkflowMetadata = {
    source: row.source,
    isDemoFixture: row.isDemoFixture,
    supplyCountry: row.supplyCountry ?? row.country,
    loadingLocation: optionalText(row.loadingLocation),
    availableForExport: row.availableForExport,
  };
  return { supplier, metadata, outreachStatus: row.outreachStatus };
}

export function checkRowId(supplierId: string, checkKey: string): string {
  return `${supplierId}:${checkKey}`;
}

