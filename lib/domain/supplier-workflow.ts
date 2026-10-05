import type { VerificationStatus } from "./supplier";

export const SUPPLIER_OUTREACH_STATUSES = [
  "NOT_CONTACTED",
  "OUTREACH_SENT",
  "AWAITING_RESPONSE",
  "RESPONDED",
  "FOLLOW_UP_REQUIRED",
  "IN_DISCUSSION",
  "NO_RESPONSE",
  "DECLINED",
] as const;
export type SupplierOutreachStatus = (typeof SUPPLIER_OUTREACH_STATUSES)[number];

export const COMMUNICATION_TYPES = ["EMAIL", "PHONE", "WHATSAPP", "MEETING", "OTHER"] as const;
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];
export const COMMUNICATION_DIRECTIONS = ["OUTBOUND", "INBOUND"] as const;
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];

export const FOLLOW_UP_STATUSES = ["OPEN", "COMPLETED", "CANCELLED"] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
export const FOLLOW_UP_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type FollowUpPriority = (typeof FOLLOW_UP_PRIORITIES)[number];

export const INFORMATION_ITEM_STATUSES = ["NOT_REQUESTED", "REQUESTED", "RECEIVED", "NOT_AVAILABLE"] as const;
export type InformationItemStatus = (typeof INFORMATION_ITEM_STATUSES)[number];

export const INFORMATION_REQUEST_ITEMS = [
  { id: "current-assay", label: "Current assay / certificate", group: "Product and quality" },
  { id: "commodity", label: "Commodity", group: "Product and quality" },
  { id: "product-type", label: "Product type", group: "Product and quality" },
  { id: "grade", label: "Grade", group: "Product and quality" },
  { id: "sulphur", label: "Sulphur", group: "Product and quality" },
  { id: "impurities", label: "Impurities", group: "Product and quality" },
  { id: "monthly-capacity", label: "Monthly capacity", group: "Commercial supply" },
  { id: "trial-quantity", label: "Trial quantity", group: "Commercial supply" },
  { id: "origin", label: "Origin", group: "Logistics" },
  { id: "loading-location", label: "Loading location", group: "Logistics" },
  { id: "stock-availability", label: "Stock availability", group: "Logistics" },
  { id: "product-photos", label: "Product photos", group: "Documents and evidence" },
  { id: "stock-photos", label: "Stock photos", group: "Documents and evidence" },
  { id: "company-registration", label: "Company registration", group: "Documents and evidence" },
  { id: "mining-licence", label: "Mining licence where applicable", group: "Documents and evidence" },
  { id: "export-licence", label: "Export licence / capability", group: "Documents and evidence" },
  { id: "inspection-docs", label: "SGS / CCIC documentation if available", group: "Documents and evidence" },
  { id: "pricing-basis", label: "Pricing basis", group: "Commercial supply" },
  { id: "incoterm-capability", label: "Incoterm capability", group: "Commercial supply" },
  { id: "sales-contact", label: "Sales contact", group: "Contact" },
] as const;
export type InformationRequestItemId = (typeof INFORMATION_REQUEST_ITEMS)[number]["id"];

export const ASSAY_SOURCES = ["SUPPLIER", "SGS", "CCIC", "LABORATORY", "OTHER"] as const;
export type AssaySource = (typeof ASSAY_SOURCES)[number];

export const SUPPLIER_DOCUMENT_TYPES = [
  "ASSAY_CERTIFICATE",
  "MINING_LICENSE",
  "EXPORT_LICENSE",
  "COMPANY_REGISTRATION",
  "SGS_REPORT",
  "CCIC_REPORT",
  "PRODUCT_PHOTO",
  "STOCK_PHOTO",
  "OTHER",
] as const;
export type SupplierDocumentType = (typeof SUPPLIER_DOCUMENT_TYPES)[number];

export const VERIFICATION_CHECK_STATUSES = ["VERIFIED", "PENDING", "MISSING", "REJECTED"] as const;
export type VerificationCheckStatus = (typeof VERIFICATION_CHECK_STATUSES)[number];

export interface SupplierVerificationCheck {
  id: string;
  label: string;
  status: VerificationCheckStatus;
  note?: string;
  updatedAt: string;
}

export interface SupplierAssay {
  id: string;
  supplierId: string;
  productId: string;
  source: AssaySource;
  gradePercent: number;
  sulphurPercent?: number;
  arsenicPercent?: number;
  chlorinePercent?: number;
  cadmiumPercent?: number;
  mercuryPercent?: number;
  fluorinePercent?: number;
  leadPercent?: number;
  zincPercent?: number;
  particleSizeMm?: number;
  laboratoryName?: string;
  certificateRef?: string;
  testedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface SupplierDocumentRecord {
  id: string;
  supplierId: string;
  type: SupplierDocumentType;
  name: string;
  reference?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: VerificationStatus;
  notes?: string;
  storageState: "METADATA_ONLY";
  createdAt: string;
}

export const SUPPLIER_ACTIVITY_TYPES = [
  "SUPPLIER_CREATED",
  "CONTACT_ADDED",
  "PRODUCT_ADDED",
  "ASSAY_RECEIVED",
  "DOCUMENT_RECORDED",
  "DOCUMENT_VERIFIED",
  "CHECK_UPDATED",
  "VERIFICATION_CHANGED",
  "VERIFICATION_STARTED",
  "VERIFICATION_COMPLETED",
  "SUPPLIER_REJECTED",
  "PIPELINE_CHANGED",
  "SUPPLIER_CONTACTED",
  "DOCUMENTS_REQUESTED",
  "SUPPLIER_QUALIFIED",
  "PIPELINE_REJECTED",
  "BUYER_MATCH_PERFORMED",
  "COMMUNICATION_LOGGED",
  "FOLLOW_UP_SCHEDULED",
  "FOLLOW_UP_COMPLETED",
  "FOLLOW_UP_CANCELLED",
  "INFORMATION_REQUESTED",
  "INFORMATION_RECEIVED",
  "INFORMATION_STATUS_CHANGED",
  "OUTREACH_STATUS_CHANGED",
] as const;
export type SupplierActivityType = (typeof SUPPLIER_ACTIVITY_TYPES)[number];

export interface SupplierActivity {
  id: string;
  supplierId: string;
  type: SupplierActivityType;
  title: string;
  details: string;
  actorUserId?: string;
  actorName?: string;
  createdAt: string;
}

export interface SupplierWorkflowMetadata {
  source: string;
  isDemoFixture: boolean;
  supplyCountry: string;
  loadingLocation?: string;
  availableForExport: boolean;
}

export interface SupplierCommunication {
  id: string;
  supplierId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  contactId?: string;
  requirementId?: string;
  occurredAt: string;
  subject: string;
  summary: string;
  outcome?: string;
  nextAction?: string;
  followUpDate?: string;
  internalNotes?: string;
  deliveryStatus: "NOT_SENT";
  isDemoFixture: boolean;
  createdAt: string;
}

export interface SupplierFollowUp {
  id: string;
  supplierId: string;
  communicationId?: string;
  informationRequestId?: string;
  contactId?: string;
  dueAt: string;
  priority: FollowUpPriority;
  owner: string;
  action: string;
  status: FollowUpStatus;
  completedAt?: string;
  isDemoFixture: boolean;
  createdAt: string;
}

export interface SupplierInformationRequest {
  id: string;
  supplierId: string;
  contactId?: string;
  requirementId?: string;
  itemIds: InformationRequestItemId[];
  requestedAt: string;
  dueAt?: string;
  internalNote?: string;
  draftMessage: string;
  deliveryStatus: "NOT_SENT";
  isDemoFixture: boolean;
  createdAt: string;
}
