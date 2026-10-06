// Phase 7 — deal ops mapping: shipments + inspections (pure).
import type {
  DealInspectionMilestone,
  DealShipment,
} from "@/lib/domain/deal-workflow";
import { assertId, fromDecimal, optionalText, toDecimalString, type WithDecimalCols } from "./decimal-mapping";

export interface PrismaShipmentRow {
  id: string; dealId: string;
  plannedQuantityMt: string | null;
  actualQuantityMt: string | null;
  loadingLocation: string | null; destinationPort: string | null;
  etd: string | null; eta: string | null; packing: string | null;
  inspectionCompany: DealShipment["inspectionCompany"] | null;
  inspectionReference: string | null; billOfLadingReference: string | null;
  status: DealShipment["status"]; notes: string | null; isDemoFixture: boolean;
  createdAt: Date; updatedAt: Date;
}

export function mapShipmentToPrisma(s: DealShipment): Omit<PrismaShipmentRow, "createdAt" | "updatedAt"> {
  assertId(s.id, "shipment id");
  const qty = (v: number | undefined) => toDecimalString(v) ?? null;
  return {
    id: s.id, dealId: s.dealId,
    plannedQuantityMt: qty(s.plannedQuantityMt), actualQuantityMt: qty(s.actualQuantityMt),
    loadingLocation: s.loadingLocation ?? null, destinationPort: s.destinationPort ?? null,
    etd: s.etd ?? null, eta: s.eta ?? null, packing: s.packing ?? null,
    inspectionCompany: s.inspectionCompany ?? null,
    inspectionReference: s.inspectionReference ?? null,
    billOfLadingReference: s.billOfLadingReference ?? null,
    status: s.status, notes: s.notes ?? null, isDemoFixture: s.isDemoFixture,
  };
}

/** Read-side row: Prisma returns Decimal columns as runtime Decimal values. */
export type PrismaShipmentReadRow = WithDecimalCols<PrismaShipmentRow, "plannedQuantityMt" | "actualQuantityMt">;

export function mapPrismaToShipment(row: PrismaShipmentReadRow): DealShipment {
  return {
    id: row.id, dealId: row.dealId,
    plannedQuantityMt: fromDecimal(row.plannedQuantityMt),
    actualQuantityMt: fromDecimal(row.actualQuantityMt),
    loadingLocation: optionalText(row.loadingLocation),
    destinationPort: optionalText(row.destinationPort),
    etd: optionalText(row.etd), eta: optionalText(row.eta),
    packing: optionalText(row.packing),
    inspectionCompany: row.inspectionCompany ?? undefined,
    inspectionReference: optionalText(row.inspectionReference),
    billOfLadingReference: optionalText(row.billOfLadingReference),
    status: row.status, notes: optionalText(row.notes), isDemoFixture: row.isDemoFixture,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

export interface PrismaInspectionRow {
  id: string; dealId: string; shipmentId: string | null;
  point: DealInspectionMilestone["point"]; agency: DealInspectionMilestone["agency"];
  reference: string | null; date: string | null;
  status: DealInspectionMilestone["status"]; resultNotes: string | null;
  createdAt: Date; updatedAt: Date;
}

export function mapInspectionToPrisma(m: DealInspectionMilestone): Omit<PrismaInspectionRow, "createdAt" | "updatedAt"> {
  assertId(m.id, "inspection id");
  return {
    id: m.id, dealId: m.dealId, shipmentId: m.shipmentId ?? null,
    point: m.point, agency: m.agency, reference: m.reference ?? null,
    date: m.date ?? null, status: m.status, resultNotes: m.resultNotes ?? null,
  };
}

export function mapPrismaToInspection(row: PrismaInspectionRow): DealInspectionMilestone {
  return {
    id: row.id, dealId: row.dealId, shipmentId: optionalText(row.shipmentId),
    point: row.point, agency: row.agency, reference: optionalText(row.reference),
    date: optionalText(row.date), status: row.status,
    resultNotes: optionalText(row.resultNotes),
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}
