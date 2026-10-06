// Phase 7 — assay/document/check/activity mapping (pure).
import type {
  SupplierActivity,
  SupplierAssay,
  SupplierDocumentRecord,
  SupplierVerificationCheck,
} from "@/lib/domain/supplier-workflow";
import { assertId, fromDate, fromDecimal, optionalText, toDate, toDecimalString } from "./decimal-mapping";
import type { PrismaAssayReadRow, PrismaAssayRow } from "./product-mapper";
import { checkRowId } from "./supplier-mapper";

const req = (v: number | undefined): string => toDecimalString(v) ?? "0";
const opt = (v: number | undefined): string | null => toDecimalString(v) ?? null;

export function mapAssayToPrisma(assay: SupplierAssay): Omit<PrismaAssayRow, "createdAt"> {
  assertId(assay.id, "assay id");
  return {
    id: assay.id, productId: assay.productId, source: assay.source,
    gradePercent: req(assay.gradePercent), sulphurPercent: opt(assay.sulphurPercent),
    arsenicPercent: opt(assay.arsenicPercent), chlorinePercent: opt(assay.chlorinePercent),
    cadmiumPercent: opt(assay.cadmiumPercent), mercuryPercent: opt(assay.mercuryPercent),
    fluorinePercent: opt(assay.fluorinePercent), leadPercent: opt(assay.leadPercent),
    zincPercent: opt(assay.zincPercent), particleSizeMm: opt(assay.particleSizeMm),
    laboratoryName: assay.laboratoryName ?? null, certificateRef: assay.certificateRef ?? null,
    testedAt: toDate(assay.testedAt) ?? null, notes: assay.notes ?? null,
  };
}

export function mapPrismaToAssay(row: PrismaAssayReadRow, supplierId: string): SupplierAssay {
  return {
    id: row.id, supplierId, productId: row.productId, source: row.source,
    gradePercent: fromDecimal(row.gradePercent) ?? 0,
    sulphurPercent: fromDecimal(row.sulphurPercent), arsenicPercent: fromDecimal(row.arsenicPercent),
    chlorinePercent: fromDecimal(row.chlorinePercent), cadmiumPercent: fromDecimal(row.cadmiumPercent),
    mercuryPercent: fromDecimal(row.mercuryPercent), fluorinePercent: fromDecimal(row.fluorinePercent),
    leadPercent: fromDecimal(row.leadPercent), zincPercent: fromDecimal(row.zincPercent),
    particleSizeMm: fromDecimal(row.particleSizeMm),
    laboratoryName: optionalText(row.laboratoryName), certificateRef: optionalText(row.certificateRef),
    testedAt: fromDate(row.testedAt), notes: optionalText(row.notes),
    createdAt: row.createdAt.toISOString(),
  };
}

export interface PrismaSupplierDocumentRow {
  id: string; supplierId: string; type: SupplierDocumentRecord["type"]; name: string;
  reference: string | null; issuedAt: Date | null; expiresAt: Date | null;
  status: SupplierDocumentRecord["status"]; notes: string | null; createdAt: Date;
}

export function mapDocumentToPrisma(d: SupplierDocumentRecord): Omit<PrismaSupplierDocumentRow, "createdAt"> {
  assertId(d.id, "document id");
  return {
    id: d.id, supplierId: d.supplierId, type: d.type, name: d.name,
    reference: d.reference ?? null, issuedAt: toDate(d.issuedAt) ?? null,
    expiresAt: toDate(d.expiresAt) ?? null, status: d.status, notes: d.notes ?? null,
  };
}

export function mapPrismaToDocument(row: PrismaSupplierDocumentRow): SupplierDocumentRecord {
  return {
    id: row.id, supplierId: row.supplierId, type: row.type, name: row.name,
    reference: optionalText(row.reference), issuedAt: fromDate(row.issuedAt),
    expiresAt: fromDate(row.expiresAt), status: row.status, notes: optionalText(row.notes),
    storageState: "METADATA_ONLY", createdAt: row.createdAt.toISOString(),
  };
}

export interface PrismaVerificationCheckRow {
  id: string; supplierId: string; checkKey: string; label: string;
  status: SupplierVerificationCheck["status"]; note: string | null;
}

export function mapCheckToPrisma(supplierId: string, check: SupplierVerificationCheck): PrismaVerificationCheckRow {
  return {
    id: checkRowId(supplierId, check.id), supplierId, checkKey: check.id,
    label: check.label, status: check.status, note: check.note ?? null,
  };
}

export function mapPrismaToCheck(row: PrismaVerificationCheckRow, updatedAt: string): SupplierVerificationCheck {
  return { id: row.checkKey, label: row.label, status: row.status, note: optionalText(row.note), updatedAt };
}

export interface PrismaSupplierActivityRow {
  id: string; supplierId: string; type: SupplierActivity["type"]; title: string; details: string;
  actorUserId: string | null; actorName: string | null; createdAt: Date;
}

export function mapActivityToPrisma(a: SupplierActivity): Omit<PrismaSupplierActivityRow, "createdAt"> {
  assertId(a.id, "activity id");
  return {
    id: a.id, supplierId: a.supplierId, type: a.type, title: a.title, details: a.details,
    actorUserId: a.actorUserId ?? null, actorName: a.actorName ?? null,
  };
}

export function mapPrismaToActivity(row: PrismaSupplierActivityRow): SupplierActivity {
  return {
    id: row.id, supplierId: row.supplierId, type: row.type, title: row.title, details: row.details,
    actorUserId: optionalText(row.actorUserId), actorName: optionalText(row.actorName),
    createdAt: row.createdAt.toISOString(),
  };
}
