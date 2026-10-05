// Pure, side-effect-free supplier workspace model.
//
// Owns the SupplierWorkspace aggregate shape, localStorage storage keys, the
// seeded development workspace, and the normalization pass applied when
// loading persisted data. This module must never touch browser globals so it
// can be imported from server code and tests.
import type { Deal, MineralProduct, Supplier } from "@/lib/domain";
import type {
  InformationItemStatus,
  InformationRequestItemId,
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
import { INFORMATION_REQUEST_ITEMS } from "@/lib/domain/supplier-workflow";
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
import {
  dealRecords as fixtureDeals,
  supplierProducts as fixtureProducts,
  supplierProfiles as fixtureSuppliers,
} from "@/lib/data/demo-data";

export const WORKSPACE_VERSION = 3;

export const WORKSPACE_STORAGE_KEYS = {
  current: "minerallink:supplier-workspace:v3",
  previous: "minerallink:supplier-workspace:v2",
  legacy: "minerallink:supplier-workspace:v1",
} as const;

export const WORKSPACE_CHANGE_EVENT = "minerallink:supplier-workspace-change";

export const checkDefinitions = [
  { id: "company-registration", label: "Company registration" },
  { id: "mining-license", label: "Mining licence" },
  { id: "export-license", label: "Export licence" },
  { id: "assay-certificate", label: "Assay certificate" },
  { id: "independent-evidence", label: "Independent SGS / CCIC evidence" },
  { id: "product-photos", label: "Product photos" },
  { id: "stock-evidence", label: "Stock evidence" },
  { id: "project-verification", label: "Mine / project verification" },
  { id: "contact-verification", label: "Contact verification" },
] as const;

export interface SupplierWorkspace {
  version: 3;
  suppliers: Supplier[];
  products: Record<string, MineralProduct[]>;
  assays: Record<string, SupplierAssay[]>;
  documents: Record<string, SupplierDocumentRecord[]>;
  checks: Record<string, SupplierVerificationCheck[]>;
  activities: Record<string, SupplierActivity[]>;
  metadata: Record<string, SupplierWorkflowMetadata>;
  outreachStatuses: Record<string, SupplierOutreachStatus>;
  communications: Record<string, SupplierCommunication[]>;
  followUps: SupplierFollowUp[];
  informationRequests: SupplierInformationRequest[];
  informationStatuses: Record<string, Record<InformationRequestItemId, InformationItemStatus>>;
  deals: Deal[];
  dealMetadata: Record<string, DealMetadata>;
  commercialTerms: Record<string, DealCommercialTerms>;
  buyerIntroductions: Record<string, BuyerIntroduction>;
  negotiationRounds: Record<string, DealNegotiationRound[]>;
  shipments: DealShipment[];
  inspections: DealInspectionMilestone[];
  paymentMilestones: DealPaymentMilestone[];
  commissions: Record<string, DealCommission>;
  dealActivities: Record<string, DealActivity[]>;
}

function now(): string {
  return new Date().toISOString();
}

function dateOffset(offset: number, hour: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function supplierProfilesById(supplierId: string): Supplier | undefined {
  return fixtureSuppliers.find((supplier) => supplier.id === supplierId);
}

export function initialWorkspace(): SupplierWorkspace {
  const timestamp = now();
  const trialDeal: Deal = {
    id: "demo-deal-trial",
    buyerId: "buyer-001",
    supplierId: "supplier-match",
    requirementId: "req-copper-concentrate-001",
    productId: "product-copper-match",
    status: "TRIAL_SHIPMENT",
    quantityMt: 80,
    notes: "Synthetic trial-stage example; no actual shipment or commercial commitment.",
    createdAt: "2026-10-04T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  };
  const deals = [...fixtureDeals, trialDeal];
  const dealMetadata: Record<string, DealMetadata> = Object.fromEntries(deals.map((deal) => [deal.id, {
    isDemoFixture: true,
    supplyType: deal.id === "demo-deal-trial" ? "TRIAL" : deal.quantityMt && deal.quantityMt <= 100 ? "TRIAL" : "RECURRING",
    destination: "China",
  }]));
  const commercialTerms: Record<string, DealCommercialTerms> = Object.fromEntries(deals.map((deal) => [deal.id, {
    quantityMt: deal.quantityMt,
    pricePerMt: deal.pricePerMt,
    currency: deal.currency,
    valueState: "INDICATIVE",
    updatedAt: deal.updatedAt,
  }]));
  const commissions: Record<string, DealCommission> = Object.fromEntries(deals.map((deal) => [deal.id, {
    dealId: deal.id,
    type: "PERCENTAGE",
    percentage: deal.commissionPercent,
    currency: deal.currency,
    status: "NOT_AGREED",
    updatedAt: deal.updatedAt,
  }]));
  const dealActivities: Record<string, DealActivity[]> = Object.fromEntries(deals.map((deal) => [deal.id, [{
    id: `demo-deal-created-${deal.id}`,
    dealId: deal.id,
    type: "DEAL_CREATED",
    title: "Synthetic deal fixture loaded",
    details: "Development example only. This is not a genuine transaction, buyer introduction, shipment, payment, or commission.",
    createdAt: deal.createdAt,
  }]]));
  const checks = Object.fromEntries(
    fixtureSuppliers.map((supplier) => [
      supplier.id,
      checkDefinitions.map((definition) => ({ ...definition, status: "MISSING" as const, updatedAt: timestamp })),
    ]),
  );
  const activities: Record<string, SupplierActivity[]> = Object.fromEntries(
    fixtureSuppliers.map((supplier) => [
      supplier.id,
      [
        {
          id: `demo-fixture-created-${supplier.id}`,
          supplierId: supplier.id,
          type: "SUPPLIER_CREATED" as const,
          title: "Development fixture loaded",
          details: "Synthetic demo profile; not a real supplier record or evidence claim.",
          createdAt: supplier.createdAt,
        },
        {
          id: `demo-outreach-status-${supplier.id}`,
          supplierId: supplier.id,
          type: "OUTREACH_STATUS_CHANGED" as const,
          title: "Synthetic outreach scenario configured",
          details: "Development scenario only; no email, message, or call occurred.",
          createdAt: supplier.updatedAt,
        },
      ],
    ]),
  );
  const outreachStatuses: Record<string, SupplierOutreachStatus> = {
    "supplier-match": "IN_DISCUSSION",
    "supplier-fail": "FOLLOW_UP_REQUIRED",
    "supplier-incomplete": "RESPONDED",
    "supplier-amber": "AWAITING_RESPONSE",
  };
  const followUps: SupplierFollowUp[] = [
    {
      id: "demo-follow-up-overdue", supplierId: "supplier-fail", contactId: "contact-fail-1",
      dueAt: dateOffset(-1, 10), priority: "URGENT", owner: "Unassigned", action: "Review the synthetic supplier scenario and decide whether to continue qualification.",
      status: "OPEN", isDemoFixture: true, createdAt: supplierProfilesById("supplier-fail")?.updatedAt ?? timestamp,
    },
    {
      id: "demo-follow-up-today", supplierId: "supplier-incomplete", contactId: "contact-partial-1",
      dueAt: dateOffset(0, 14), priority: "HIGH", owner: "Unassigned", action: "Review the synthetic response and identify missing product information.",
      status: "OPEN", isDemoFixture: true, createdAt: supplierProfilesById("supplier-incomplete")?.updatedAt ?? timestamp,
    },
    {
      id: "demo-follow-up-upcoming", supplierId: "supplier-amber", contactId: "contact-amber-1",
      dueAt: dateOffset(2, 11), priority: "MEDIUM", owner: "Unassigned", action: "Review the synthetic outreach scenario and plan a follow-up.",
      status: "OPEN", isDemoFixture: true, createdAt: supplierProfilesById("supplier-amber")?.updatedAt ?? timestamp,
    },
    {
      id: "demo-follow-up-completed", supplierId: "supplier-match", contactId: "contact-match-1",
      dueAt: dateOffset(-3, 9), priority: "LOW", owner: "Unassigned", action: "Review the synthetic in-discussion scenario.",
      status: "COMPLETED", completedAt: supplierProfilesById("supplier-match")?.updatedAt ?? timestamp,
      isDemoFixture: true, createdAt: supplierProfilesById("supplier-match")?.updatedAt ?? timestamp,
    },
  ];
  const demoCommunications: Record<string, SupplierCommunication[]> = {
    "supplier-fail": [
      {
        id: "demo-communication-awaiting", supplierId: "supplier-fail", type: "EMAIL", direction: "OUTBOUND",
        contactId: "contact-fail-1", occurredAt: dateOffset(-2, 9), subject: "Synthetic initial qualification request",
        summary: "Example request for current assay, monthly capacity, trial quantity, and export documentation.",
        outcome: "Awaiting response in this synthetic scenario", nextAction: "Review follow-up task",
        followUpDate: dateOffset(-1, 0).slice(0, 10), internalNotes: "Synthetic CRM fixture; no email was sent or received.",
        deliveryStatus: "NOT_SENT", isDemoFixture: true, createdAt: dateOffset(-2, 9),
      },
    ],
    "supplier-incomplete": [
      {
        id: "demo-communication-response", supplierId: "supplier-incomplete", type: "EMAIL", direction: "INBOUND",
        contactId: "contact-partial-1", occurredAt: dateOffset(-1, 11), subject: "Synthetic supplier response",
        summary: "Example response scenario: supplier indicates interest and is assembling updated product information.",
        outcome: "Supplier response scenario recorded", nextAction: "Review requested assay and capacity information",
        internalNotes: "Synthetic CRM fixture; no real supplier communication occurred.",
        deliveryStatus: "NOT_SENT", isDemoFixture: true, createdAt: dateOffset(-1, 11),
      },
    ],
    "supplier-match": [
      {
        id: "demo-communication-discussion", supplierId: "supplier-match", type: "PHONE", direction: "INBOUND",
        contactId: "contact-match-1", occurredAt: dateOffset(-1, 15), subject: "Synthetic commercial discussion",
        summary: "Example discussion scenario covering expected volumes and indicative inspection requirements.",
        outcome: "In discussion in this synthetic scenario", nextAction: "Review active buyer fit",
        internalNotes: "Synthetic CRM fixture; no real call took place.",
        deliveryStatus: "NOT_SENT", isDemoFixture: true, createdAt: dateOffset(-1, 15),
      },
    ],
    "supplier-amber": [
      {
        id: "demo-communication-intro", supplierId: "supplier-amber", type: "EMAIL", direction: "OUTBOUND",
        contactId: "contact-amber-1", occurredAt: dateOffset(-1, 8), subject: "Synthetic initial supplier introduction",
        summary: "Example introduction scenario asking for product and supply information.",
        outcome: "Awaiting response in this synthetic scenario", nextAction: "Review response queue",
        internalNotes: "Synthetic CRM fixture; no email was sent or received.",
        deliveryStatus: "NOT_SENT", isDemoFixture: true, createdAt: dateOffset(-1, 8),
      },
    ],
  };
  const informationStatuses = Object.fromEntries(fixtureSuppliers.map((supplier) => [
    supplier.id,
    Object.fromEntries(INFORMATION_REQUEST_ITEMS.map((item) => [item.id, "NOT_REQUESTED"])),
  ])) as SupplierWorkspace["informationStatuses"];
  informationStatuses["supplier-incomplete"]["commodity"] = "RECEIVED";
  informationStatuses["supplier-incomplete"]["grade"] = "RECEIVED";
  for (const supplier of fixtureSuppliers) {
    if (supplier.id === "supplier-incomplete") {
      activities[supplier.id].push({
        id: "demo-information-received-activity", supplierId: supplier.id, type: "INFORMATION_RECEIVED",
        title: "Synthetic information receipt scenario",
        details: "Commodity and grade collection items are marked RECEIVED in this synthetic scenario; this does not verify an assay or document.",
        createdAt: dateOffset(-1, 11),
      });
    }
    for (const communication of demoCommunications[supplier.id] ?? []) {
      activities[supplier.id].push({
        id: `${communication.id}-activity`, supplierId: supplier.id, type: "COMMUNICATION_LOGGED",
        title: `Synthetic ${communication.direction.toLowerCase()} communication scenario`,
        details: `${communication.type} · ${communication.subject}. No real communication occurred.`, createdAt: communication.createdAt,
      });
    }
    for (const followUp of followUps.filter((item) => item.supplierId === supplier.id)) {
      activities[supplier.id].push({
        id: `${followUp.id}-activity`, supplierId: supplier.id, type: "FOLLOW_UP_SCHEDULED",
        title: "Synthetic follow-up scenario", details: `${followUp.action} · due ${followUp.dueAt.slice(0, 10)} · ${followUp.priority}.`, createdAt: followUp.createdAt,
      });
    }
    activities[supplier.id].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  return {
    version: 3,
    suppliers: fixtureSuppliers,
    products: fixtureProducts,
    assays: {},
    documents: {},
    checks,
    activities,
    metadata: Object.fromEntries(
      fixtureSuppliers.map((supplier) => [
        supplier.id,
        {
          source: "Seeded development fixture",
          isDemoFixture: true,
          supplyCountry: supplier.country,
          loadingLocation: fixtureProducts[supplier.id]?.[0]?.loadingLocation,
          availableForExport: fixtureProducts[supplier.id]?.[0]?.availableForExport ?? false,
        },
      ]),
    ),
    outreachStatuses,
    communications: { ...Object.fromEntries(fixtureSuppliers.map((supplier) => [supplier.id, []])), ...demoCommunications },
    followUps,
    informationRequests: [],
    informationStatuses,
    deals,
    dealMetadata,
    commercialTerms,
    buyerIntroductions: {},
    negotiationRounds: Object.fromEntries(deals.map((deal) => [deal.id, []])),
    shipments: [{
      id: "demo-shipment-planned",
      dealId: trialDeal.id,
      plannedQuantityMt: 80,
      loadingLocation: "Synthetic loading location",
      destinationPort: "Synthetic destination port",
      status: "PLANNED",
      notes: "Synthetic planned shipment example only; no shipment exists.",
      isDemoFixture: true,
      createdAt: trialDeal.createdAt,
      updatedAt: trialDeal.updatedAt,
    }],
    inspections: [],
    paymentMilestones: [],
    commissions,
    dealActivities,
  };
}

export function normalizeStoredWorkspace(parsed: Partial<SupplierWorkspace>): SupplierWorkspace {
  const defaults = initialWorkspace();
  const suppliers = parsed.suppliers ?? defaults.suppliers;
  const supplierIds = suppliers.map((supplier) => supplier.id);
  const activities = { ...defaults.activities };
  for (const [supplierId, existing] of Object.entries(parsed.activities ?? {})) {
    const existingIds = new Set(existing.map((activity) => activity.id));
    activities[supplierId] = [
      ...existing,
      ...(defaults.activities[supplierId] ?? []).filter((activity) => !existingIds.has(activity.id)),
    ];
  }
  const normalized: SupplierWorkspace = {
    ...defaults,
    ...parsed,
    version: 3,
    suppliers,
    products: { ...defaults.products, ...parsed.products },
    assays: { ...defaults.assays, ...parsed.assays },
    documents: { ...defaults.documents, ...parsed.documents },
    checks: { ...defaults.checks, ...parsed.checks },
    activities,
    metadata: { ...defaults.metadata, ...parsed.metadata },
    outreachStatuses: { ...defaults.outreachStatuses, ...parsed.outreachStatuses },
    communications: { ...defaults.communications, ...parsed.communications },
    followUps: parsed.followUps ?? defaults.followUps,
    informationRequests: parsed.informationRequests ?? defaults.informationRequests,
    informationStatuses: { ...defaults.informationStatuses, ...parsed.informationStatuses },
    deals: parsed.deals ?? defaults.deals,
    dealMetadata: { ...defaults.dealMetadata, ...parsed.dealMetadata },
    commercialTerms: { ...defaults.commercialTerms, ...parsed.commercialTerms },
    buyerIntroductions: { ...defaults.buyerIntroductions, ...parsed.buyerIntroductions },
    negotiationRounds: { ...defaults.negotiationRounds, ...parsed.negotiationRounds },
    shipments: parsed.shipments ?? defaults.shipments,
    inspections: parsed.inspections ?? defaults.inspections,
    paymentMilestones: parsed.paymentMilestones ?? defaults.paymentMilestones,
    commissions: { ...defaults.commissions, ...parsed.commissions },
    dealActivities: { ...defaults.dealActivities, ...parsed.dealActivities },
  };
  for (const supplierId of supplierIds) {
    normalized.products[supplierId] ??= [];
    normalized.assays[supplierId] ??= [];
    normalized.documents[supplierId] ??= [];
    normalized.checks[supplierId] ??= [];
    normalized.activities[supplierId] ??= [];
    normalized.communications[supplierId] ??= [];
    normalized.informationStatuses[supplierId] ??= Object.fromEntries(INFORMATION_REQUEST_ITEMS.map((item) => [item.id, "NOT_REQUESTED"])) as SupplierWorkspace["informationStatuses"][string];
    normalized.outreachStatuses[supplierId] ??= "NOT_CONTACTED";
  }
  for (const deal of normalized.deals) {
    normalized.dealMetadata[deal.id] ??= { isDemoFixture: false, supplyType: "RECURRING" };
    normalized.commercialTerms[deal.id] ??= { quantityMt: deal.quantityMt, pricePerMt: deal.pricePerMt, currency: deal.currency, valueState: "INDICATIVE", updatedAt: deal.updatedAt };
    normalized.negotiationRounds[deal.id] ??= [];
    normalized.commissions[deal.id] ??= { dealId: deal.id, type: "PERCENTAGE", status: "NOT_AGREED", updatedAt: deal.updatedAt };
    normalized.dealActivities[deal.id] ??= [];
  }
  return normalized;
}



