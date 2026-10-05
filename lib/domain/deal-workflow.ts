import type { Incoterm, PaymentMethod } from "./requirement";
import type { DealStatus } from "./deal";
import type { MineralMatchResult } from "../matching/types";

export const DEAL_SUPPLY_TYPES = ["TRIAL", "RECURRING"] as const;
export type DealSupplyType = (typeof DEAL_SUPPLY_TYPES)[number];
export const COMMERCIAL_VALUE_STATES = ["INDICATIVE", "AGREED", "ACTUAL"] as const;
export type CommercialValueState = (typeof COMMERCIAL_VALUE_STATES)[number];
export const INSPECTION_AGENCIES = ["SGS", "CCIC", "OTHER"] as const;
export type InspectionAgency = (typeof INSPECTION_AGENCIES)[number];
export const NEGOTIATION_PARTIES = ["SUPPLIER", "BUYER", "INTERNAL"] as const;
export type NegotiationParty = (typeof NEGOTIATION_PARTIES)[number];
export const SHIPMENT_STATUSES = ["PLANNED", "READY_FOR_LOADING", "LOADED", "IN_TRANSIT", "ARRIVED", "INSPECTION_PENDING", "COMPLETED", "CANCELLED"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];
export const INSPECTION_STATUSES = ["PLANNED", "PENDING", "COMPLETED", "NOT_APPLICABLE"] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];
export const INSPECTION_POINTS = ["LOADING_PORT", "ARRIVAL_FINAL"] as const;
export type InspectionPoint = (typeof INSPECTION_POINTS)[number];
export const PAYMENT_MILESTONE_STATUSES = ["NOT_DUE", "DUE", "PENDING", "PAID", "PARTIALLY_PAID", "ADJUSTMENT_REQUIRED", "COMPLETED"] as const;
export type PaymentMilestoneStatus = (typeof PAYMENT_MILESTONE_STATUSES)[number];
export const COMMISSION_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];
export const COMMISSION_STATUSES = ["NOT_AGREED", "AGREED", "EARNED", "INVOICED", "PAID"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export interface DealMetadata {
  isDemoFixture: boolean;
  supplyType: DealSupplyType;
  destination?: string;
  createdFromMatch?: boolean;
  matchResult?: MineralMatchResult;
  matchEvidenceSource?: string;
}

export interface DealCommercialTerms {
  quantityMt?: number;
  pricePerMt?: number;
  currency?: string;
  incoterm?: Incoterm;
  loadingLocation?: string;
  destinationPort?: string;
  inspectionAgency?: InspectionAgency;
  paymentMethod?: PaymentMethod;
  paymentTerms?: string;
  offerValidity?: string;
  deliverySchedule?: string;
  packing?: string;
  particleSizeMm?: number;
  commercialNotes?: string;
  valueState: CommercialValueState;
  updatedAt: string;
}

export interface BuyerIntroduction {
  id: string;
  dealId: string;
  introducedAt: string;
  supplierContactId?: string;
  buyerContactName?: string;
  buyerContactEmail?: string;
  requirementId: string;
  introducedBy: string;
  internalNotes?: string;
  createdAt: string;
}

export interface DealNegotiationRound {
  id: string;
  dealId: string;
  date: string;
  party: NegotiationParty;
  quantityMt?: number;
  pricePerMt?: number;
  currency?: string;
  incoterm?: Incoterm;
  paymentMethod?: PaymentMethod;
  paymentTerms?: string;
  destination?: string;
  comments?: string;
  createdAt: string;
}

export interface DealShipment {
  id: string;
  dealId: string;
  plannedQuantityMt?: number;
  actualQuantityMt?: number;
  loadingLocation?: string;
  destinationPort?: string;
  etd?: string;
  eta?: string;
  packing?: string;
  inspectionCompany?: InspectionAgency;
  inspectionReference?: string;
  billOfLadingReference?: string;
  status: ShipmentStatus;
  notes?: string;
  isDemoFixture: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealInspectionMilestone {
  id: string;
  dealId: string;
  shipmentId?: string;
  point: InspectionPoint;
  agency: InspectionAgency;
  reference?: string;
  date?: string;
  status: InspectionStatus;
  resultNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealPaymentMilestone {
  id: string;
  dealId: string;
  milestone: string;
  expectedPercentage?: number;
  expectedAmount?: number;
  currency?: string;
  dueDate?: string;
  status: PaymentMilestoneStatus;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealCommission {
  dealId: string;
  type: CommissionType;
  percentage?: number;
  fixedAmount?: number;
  currency?: string;
  status: CommissionStatus;
  updatedAt: string;
}

export const DEAL_ACTIVITY_TYPES = [
  "DEAL_CREATED",
  "STAGE_CHANGED",
  "OFFER_RECORDED",
  "COUNTEROFFER_RECORDED",
  "BUYER_INTRODUCED",
  "CONTRACT_MILESTONE",
  "SHIPMENT_CREATED",
  "SHIPMENT_UPDATED",
  "INSPECTION_RECORDED",
  "PAYMENT_MILESTONE_UPDATED",
  "COMMISSION_UPDATED",
  "DEAL_CLOSED",
] as const;
export type DealActivityType = (typeof DEAL_ACTIVITY_TYPES)[number];

export interface DealActivity {
  id: string;
  dealId: string;
  type: DealActivityType;
  title: string;
  details: string;
  actorUserId?: string;
  actorName?: string;
  createdAt: string;
}

export function isClosedDealStatus(status: DealStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}
