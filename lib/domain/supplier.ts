export const SUPPLIER_TYPES = ["MINE", "PRODUCER", "PROCESSOR", "TRADER", "AGGREGATOR"] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export const PRODUCTION_STATUSES = ["OPERATING", "DEVELOPMENT", "EXPLORATION", "SUSPENDED", "UNKNOWN"] as const;
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];

export const VERIFICATION_STATUSES = ["UNVERIFIED", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SUPPLIER_PIPELINE_STATUSES = ["NEW", "CONTACTED", "RESPONDED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "QUALIFIED", "REJECTED"] as const;
export type SupplierPipelineStatus = (typeof SUPPLIER_PIPELINE_STATUSES)[number];

export interface SupplierContact {
  id: string;
  name: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface Supplier {
  id: string;
  companyName: string;
  tradingName?: string;
  country: string;

  supplierType: SupplierType;
  productionStatus: ProductionStatus;
  verificationStatus: VerificationStatus;
  pipelineStatus: SupplierPipelineStatus;

  mineOrProjectName?: string;
  website?: string;

  contacts: SupplierContact[];
  notes?: string;

  createdAt: string;
  updatedAt: string;
}
