export const DEAL_STATUSES = [
  "NEW",
  "SUPPLIER_CONTACTED",
  "DOCUMENTS_REQUESTED",
  "QUALIFICATION",
  "BUYER_INTRODUCTION",
  "NEGOTIATION",
  "CONTRACT",
  "TRIAL_SHIPMENT",
  "ACTIVE_CONTRACT",
  "COMPLETED",
  "CANCELLED",
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];

export interface Deal {
  id: string;

  buyerId: string;
  supplierId: string;
  requirementId: string;
  productId: string;

  status: DealStatus;

  quantityMt?: number;

  currency?: string;
  pricePerMt?: number;

  commissionPercent?: number;
  commissionAmount?: number;

  notes?: string;

  createdAt: string;
  updatedAt: string;
}
