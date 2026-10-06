// Phase 7 — Prisma server repository: shared server-only contract types.
// Operation implementations live in prisma-*-operations.ts; UI reaches them
// through `/api/workspace/*` (see `lib/repositories/server-workspace-client.ts`).
import type { MineralProduct, Supplier } from "@/lib/domain";
import type {
  SupplierActivity,
  SupplierAssay,
  SupplierCommunication,
  SupplierDocumentRecord,
  SupplierFollowUp,
  SupplierInformationRequest,
  SupplierOutreachStatus,
  SupplierVerificationCheck,
  SupplierWorkflowMetadata,
} from "@/lib/domain/supplier-workflow";
import type {
  BuyerIntroduction,
  DealActivity,
  DealCommercialTerms,
  DealCommission,
  DealInspectionMilestone,
  DealMetadata,
  DealNegotiationRound,
  DealPaymentMilestone,
  DealShipment,
} from "@/lib/domain/deal-workflow";

export interface ServerActor {
  id: string;
  name: string;
}

export interface SupplierAggregate {
  supplier: Supplier;
  metadata: SupplierWorkflowMetadata;
  outreachStatus: SupplierOutreachStatus;
  contacts: Supplier["contacts"];
  products: MineralProduct[];
  assays: SupplierAssay[];
  documents: SupplierDocumentRecord[];
  checks: SupplierVerificationCheck[];
  activities: SupplierActivity[];
  communications: SupplierCommunication[];
  followUps: SupplierFollowUp[];
  informationRequests: SupplierInformationRequest[];
}

export interface DealAggregate {
  metadata: DealMetadata;
  commercialTerms: DealCommercialTerms | undefined;
  introduction: BuyerIntroduction | undefined;
  negotiations: DealNegotiationRound[];
  shipments: DealShipment[];
  inspections: DealInspectionMilestone[];
  payments: DealPaymentMilestone[];
  commission: DealCommission | undefined;
  activities: DealActivity[];
}
