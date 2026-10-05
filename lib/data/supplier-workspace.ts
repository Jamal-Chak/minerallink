import type { Deal, DealStatus, MineralProduct, Supplier, SupplierContact } from "@/lib/domain";
import type {
  AssaySource,
  CommunicationDirection,
  CommunicationType,
  FollowUpPriority,
  FollowUpStatus,
  InformationItemStatus,
  InformationRequestItemId,
  SupplierActivity,
  SupplierActivityType,
  SupplierAssay,
  SupplierCommunication,
  SupplierDocumentRecord,
  SupplierFollowUp,
  SupplierInformationRequest,
  SupplierOutreachStatus,
  SupplierVerificationCheck,
  SupplierWorkflowMetadata,
  VerificationCheckStatus,
} from "@/lib/domain/supplier-workflow";
import type {
  BuyerIntroduction,
  DealActivity,
  DealActivityType,
  DealCommercialTerms,
  DealCommission,
  DealInspectionMilestone,
  DealMetadata,
  DealNegotiationRound,
  DealPaymentMilestone,
  DealShipment,
} from "@/lib/domain/deal-workflow";
import { INFORMATION_REQUEST_ITEMS } from "@/lib/domain/supplier-workflow";
import type {
  AssayValues,
  MineralProductValues,
  SupplierDocumentValues,
  SupplierOnboardingValues,
  CommunicationValues,
  InformationRequestValues,
} from "@/lib/validation/supplier-schemas";
import { currentClientActor, requireClientPermission } from "@/lib/auth/client-authorization";
import {
  dealRecords as fixtureDeals,
  supplierProducts as fixtureProducts,
  supplierProfiles as fixtureSuppliers,
} from "@/lib/data/demo-data";

const storageKey = "minerallink:supplier-workspace:v3";
const previousStorageKey = "minerallink:supplier-workspace:v2";
const legacyStorageKey = "minerallink:supplier-workspace:v1";
const checkDefinitions = [
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

function newId(prefix: string): string {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${id}`;
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

function initialWorkspace(): SupplierWorkspace {
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

function supplierProfilesById(supplierId: string): Supplier | undefined {
  return fixtureSuppliers.find((supplier) => supplier.id === supplierId);
}

export function getSeededSupplierWorkspace(): SupplierWorkspace {
  return initialWorkspace();
}

export function readSupplierWorkspace(): SupplierWorkspace {
  if (typeof window === "undefined") {
    return initialWorkspace();
  }

  const saved = window.localStorage.getItem(storageKey)
    ?? window.localStorage.getItem(previousStorageKey)
    ?? window.localStorage.getItem(legacyStorageKey);
  if (!saved) {
    const initial = initialWorkspace();
    window.localStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SupplierWorkspace>;
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
    const serialized = JSON.stringify(normalized);
    if (window.localStorage.getItem(storageKey) !== serialized) {
      window.localStorage.setItem(storageKey, serialized);
      window.dispatchEvent(new CustomEvent("minerallink:supplier-workspace-change"));
    }
    return normalized;
  } catch {
    const initial = initialWorkspace();
    window.localStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
  }
}

function writeSupplierWorkspace(workspace: SupplierWorkspace): void {
  window.localStorage.setItem(storageKey, JSON.stringify(workspace));
  window.dispatchEvent(new CustomEvent("minerallink:supplier-workspace-change"));
}

export function subscribeToSupplierWorkspace(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("minerallink:supplier-workspace-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("minerallink:supplier-workspace-change", onChange);
  };
}

function addActivity(
  workspace: SupplierWorkspace,
  supplierId: string,
  type: SupplierActivityType,
  title: string,
  details: string,
): void {
  const actor = currentClientActor();
  const activity: SupplierActivity = { id: newId("activity"), supplierId, type, title, details, actorUserId: actor?.id, actorName: actor?.name, createdAt: now() };
  workspace.activities[supplierId] = [activity, ...(workspace.activities[supplierId] ?? [])];
}

function addDealActivity(workspace: SupplierWorkspace, dealId: string, type: DealActivityType, title: string, details: string): void {
  const actor = currentClientActor();
  const activity: DealActivity = { id: newId("deal-activity"), dealId, type, title, details, actorUserId: actor?.id, actorName: actor?.name, createdAt: now() };
  workspace.dealActivities[dealId] = [activity, ...(workspace.dealActivities[dealId] ?? [])];
}

export function createDeal(values: {
  buyerId: string;
  supplierId: string;
  requirementId: string;
  productId: string;
  supplyType: "TRIAL" | "RECURRING";
  destination?: string;
  quantityMt?: number;
  currency?: string;
  pricePerMt?: number;
  incoterm?: "FOB" | "CIF";
  notes?: string;
  createdFromMatch?: boolean;
  matchResult?: DealMetadata["matchResult"];
  matchEvidenceSource?: string;
}): string {
  requireClientPermission("deal.create");
  const workspace = readSupplierWorkspace();
  const timestamp = now();
  const dealId = newId("deal");
  const deal: Deal = {
    id: dealId,
    buyerId: values.buyerId,
    supplierId: values.supplierId,
    requirementId: values.requirementId,
    productId: values.productId,
    status: "NEW",
    quantityMt: values.quantityMt,
    currency: values.currency || undefined,
    pricePerMt: values.pricePerMt,
    notes: values.notes || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  workspace.deals.unshift(deal);
  workspace.dealMetadata[dealId] = {
    isDemoFixture: false,
    supplyType: values.supplyType,
    destination: values.destination || undefined,
    createdFromMatch: values.createdFromMatch ?? false,
    matchResult: values.matchResult,
    matchEvidenceSource: values.matchEvidenceSource,
  };
  workspace.commercialTerms[dealId] = {
    quantityMt: values.quantityMt,
    currency: values.currency || undefined,
    pricePerMt: values.pricePerMt,
    incoterm: values.incoterm,
    valueState: "INDICATIVE",
    updatedAt: timestamp,
  };
  workspace.negotiationRounds[dealId] = [];
  workspace.commissions[dealId] = { dealId, type: "PERCENTAGE", status: "NOT_AGREED", updatedAt: timestamp };
  workspace.dealActivities[dealId] = [];
  addDealActivity(workspace, dealId, "DEAL_CREATED", "Deal created", `${values.supplyType} opportunity created${values.createdFromMatch ? " from an explicit buyer-match action" : ""}. Supplier claims retain their existing evidence labels.`);
  writeSupplierWorkspace(workspace);
  return dealId;
}

export function updateDealStage(dealId: string, status: DealStatus): void {
  requireClientPermission("deal.stage.manage");
  const workspace = readSupplierWorkspace();
  const deal = workspace.deals.find((item) => item.id === dealId);
  if (!deal || deal.status === status) return;
  const previous = deal.status;
  deal.status = status;
  deal.updatedAt = now();
  const closed = status === "COMPLETED" || status === "CANCELLED";
  const contractMilestone = status === "CONTRACT";
  const eventType = closed ? "DEAL_CLOSED" : contractMilestone ? "CONTRACT_MILESTONE" : "STAGE_CHANGED";
  const title = closed ? `Deal ${status.toLowerCase()}` : contractMilestone ? "Contract milestone recorded" : "Deal stage changed";
  addDealActivity(workspace, dealId, eventType, title, `${previous} → ${status}`);
  writeSupplierWorkspace(workspace);
}

export function saveDealCommercialTerms(dealId: string, values: Omit<DealCommercialTerms, "updatedAt">): void {
  requireClientPermission("commercial.edit");
  const workspace = readSupplierWorkspace();
  const deal = workspace.deals.find((item) => item.id === dealId);
  if (!deal) return;
  const timestamp = now();
  const terms: DealCommercialTerms = { ...values, updatedAt: timestamp };
  workspace.commercialTerms[dealId] = terms;
  deal.quantityMt = terms.quantityMt;
  deal.currency = terms.currency;
  deal.pricePerMt = terms.pricePerMt;
  deal.updatedAt = timestamp;
  workspace.dealMetadata[dealId] = { ...workspace.dealMetadata[dealId], destination: terms.destinationPort ?? workspace.dealMetadata[dealId]?.destination, isDemoFixture: workspace.dealMetadata[dealId]?.isDemoFixture ?? false, supplyType: workspace.dealMetadata[dealId]?.supplyType ?? "RECURRING" };
  addDealActivity(workspace, dealId, "OFFER_RECORDED", "Commercial offer terms recorded", `${terms.valueState} terms updated. Unknown fields remain unset.`);
  writeSupplierWorkspace(workspace);
}

export function addDealNegotiationRound(dealId: string, values: Omit<DealNegotiationRound, "id" | "dealId" | "createdAt">): void {
  requireClientPermission("commercial.edit");
  const workspace = readSupplierWorkspace();
  const rounds = workspace.negotiationRounds[dealId];
  if (!rounds || !workspace.deals.some((deal) => deal.id === dealId)) return;
  const isCounteroffer = rounds.length > 0;
  const round: DealNegotiationRound = { ...values, id: newId("negotiation"), dealId, createdAt: now() };
  workspace.negotiationRounds[dealId] = [...rounds, round];
  const price = round.pricePerMt === undefined ? "price unknown" : `${round.currency ?? "Currency unknown"} ${round.pricePerMt} / MT`;
  addDealActivity(workspace, dealId, isCounteroffer ? "COUNTEROFFER_RECORDED" : "OFFER_RECORDED", isCounteroffer ? "Counteroffer recorded" : "Offer recorded", `${round.party} · ${price} · ${round.incoterm ?? "Incoterm unknown"}`);
  writeSupplierWorkspace(workspace);
}

export function recordBuyerIntroduction(dealId: string, values: Omit<BuyerIntroduction, "id" | "dealId" | "createdAt">): void {
  requireClientPermission("deal.introduction.manage");
  const workspace = readSupplierWorkspace();
  if (!workspace.deals.some((deal) => deal.id === dealId)) return;
  const introduction: BuyerIntroduction = { ...values, id: newId("introduction"), dealId, createdAt: now() };
  workspace.buyerIntroductions[dealId] = introduction;
  addDealActivity(workspace, dealId, "BUYER_INTRODUCED", "Buyer introduction explicitly recorded", `${introduction.introducedAt.slice(0, 10)} · ${introduction.introducedBy}`);
  writeSupplierWorkspace(workspace);
}

export function createDealShipment(dealId: string, values: Omit<DealShipment, "id" | "dealId" | "isDemoFixture" | "createdAt" | "updatedAt">): void {
  requireClientPermission("shipment.manage");
  const workspace = readSupplierWorkspace();
  if (!workspace.deals.some((deal) => deal.id === dealId)) return;
  const timestamp = now();
  const shipment: DealShipment = { ...values, id: newId("shipment"), dealId, isDemoFixture: false, createdAt: timestamp, updatedAt: timestamp };
  workspace.shipments.unshift(shipment);
  addDealActivity(workspace, dealId, "SHIPMENT_CREATED", "Trial shipment explicitly recorded", `${shipment.status} · ${shipment.plannedQuantityMt ?? "Quantity unknown"} MT planned`);
  writeSupplierWorkspace(workspace);
}

export function updateDealShipment(shipmentId: string, values: Partial<Omit<DealShipment, "id" | "dealId" | "isDemoFixture" | "createdAt" | "updatedAt">>): void {
  requireClientPermission("shipment.manage");
  const workspace = readSupplierWorkspace();
  const shipment = workspace.shipments.find((item) => item.id === shipmentId);
  if (!shipment) return;
  Object.assign(shipment, values, { updatedAt: now() });
  addDealActivity(workspace, shipment.dealId, "SHIPMENT_UPDATED", "Shipment record updated", `${shipment.status}${shipment.billOfLadingReference ? ` · B/L ${shipment.billOfLadingReference}` : ""}`);
  writeSupplierWorkspace(workspace);
}

export function addDealInspection(dealId: string, values: Omit<DealInspectionMilestone, "id" | "dealId" | "createdAt" | "updatedAt">): void {
  requireClientPermission("shipment.manage");
  const workspace = readSupplierWorkspace();
  if (!workspace.deals.some((deal) => deal.id === dealId)) return;
  const timestamp = now();
  const inspection: DealInspectionMilestone = { ...values, id: newId("inspection"), dealId, createdAt: timestamp, updatedAt: timestamp };
  workspace.inspections.unshift(inspection);
  addDealActivity(workspace, dealId, "INSPECTION_RECORDED", "Inspection milestone recorded", `${inspection.point.replaceAll("_", " ")} · ${inspection.agency} · ${inspection.status}`);
  writeSupplierWorkspace(workspace);
}

export function addDealPaymentMilestone(dealId: string, values: Omit<DealPaymentMilestone, "id" | "dealId" | "createdAt" | "updatedAt">): void {
  requireClientPermission("payment.manage");
  const workspace = readSupplierWorkspace();
  if (!workspace.deals.some((deal) => deal.id === dealId)) return;
  const timestamp = now();
  const payment: DealPaymentMilestone = { ...values, id: newId("payment"), dealId, createdAt: timestamp, updatedAt: timestamp };
  workspace.paymentMilestones.unshift(payment);
  addDealActivity(workspace, dealId, "PAYMENT_MILESTONE_UPDATED", "Payment milestone recorded", `${payment.milestone} · ${payment.expectedPercentage ?? "Percentage unknown"}% · ${payment.status}. Operational tracking only; no payment executed.`);
  writeSupplierWorkspace(workspace);
}

export function updateDealPaymentMilestone(paymentId: string, status: DealPaymentMilestone["status"], reference?: string, notes?: string): void {
  requireClientPermission("payment.manage");
  const workspace = readSupplierWorkspace();
  const payment = workspace.paymentMilestones.find((item) => item.id === paymentId);
  if (!payment) return;
  payment.status = status;
  payment.reference = reference?.trim() || payment.reference;
  payment.notes = notes?.trim() || payment.notes;
  payment.updatedAt = now();
  addDealActivity(workspace, payment.dealId, "PAYMENT_MILESTONE_UPDATED", "Payment milestone status changed", `${payment.milestone} · ${status}. Recorded status only; no funds moved through MineralLink.`);
  writeSupplierWorkspace(workspace);
}

export function saveDealCommission(dealId: string, values: Omit<DealCommission, "dealId" | "updatedAt">): void {
  requireClientPermission("commission.edit");
  const workspace = readSupplierWorkspace();
  if (!workspace.deals.some((deal) => deal.id === dealId)) return;
  workspace.commissions[dealId] = { ...values, dealId, updatedAt: now() };
  addDealActivity(workspace, dealId, "COMMISSION_UPDATED", "Commission terms updated", `${values.status} · ${values.type === "PERCENTAGE" ? `${values.percentage ?? "Unknown"}%` : `${values.currency ?? "Currency unknown"} ${values.fixedAmount ?? "Unknown"}`}`);
  writeSupplierWorkspace(workspace);
}

export function createSupplier(values: SupplierOnboardingValues): string {
  requireClientPermission("supplier.create");
  const workspace = readSupplierWorkspace();
  const supplierId = newId("supplier");
  const timestamp = now();
  const contact: SupplierContact = {
    id: newId("contact"),
    name: values.contactName,
    jobTitle: values.contactJobTitle || undefined,
    email: values.contactEmail || undefined,
    phone: values.contactPhone || undefined,
    isPrimary: true,
  };
  const supplier: Supplier = {
    id: supplierId,
    companyName: values.companyName,
    tradingName: values.tradingName || undefined,
    country: values.country,
    supplierType: values.supplierType,
    productionStatus: values.productionStatus,
    verificationStatus: "UNVERIFIED",
    pipelineStatus: "NEW",
    mineOrProjectName: values.mineOrProjectName || undefined,
    website: values.website || undefined,
    contacts: [contact],
    notes: values.notes || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  workspace.suppliers.unshift(supplier);
  workspace.products[supplierId] = [];
  workspace.assays[supplierId] = [];
  workspace.documents[supplierId] = [];
  workspace.communications[supplierId] = [];
  workspace.outreachStatuses[supplierId] = "NOT_CONTACTED";
  workspace.informationStatuses[supplierId] = Object.fromEntries(INFORMATION_REQUEST_ITEMS.map((item) => [item.id, "NOT_REQUESTED"])) as SupplierWorkspace["informationStatuses"][string];
  workspace.checks[supplierId] = checkDefinitions.map((definition) => ({ ...definition, status: "MISSING", updatedAt: timestamp }));
  workspace.activities[supplierId] = [];
  workspace.metadata[supplierId] = {
    source: values.source,
    isDemoFixture: false,
    supplyCountry: values.supplyCountry,
    loadingLocation: values.loadingLocation,
    availableForExport: values.availableForExport,
  };
  addActivity(workspace, supplierId, "SUPPLIER_CREATED", "Supplier created", "New supplier record added in browser development mode.");
  addActivity(workspace, supplierId, "CONTACT_ADDED", "Primary contact added", `${contact.name}${contact.email ? ` · ${contact.email}` : ""}`);
  writeSupplierWorkspace(workspace);
  return supplierId;
}

export function addMineralProduct(supplierId: string, values: MineralProductValues): void {
  requireClientPermission("supplier.update");
  const workspace = readSupplierWorkspace();
  const timestamp = now();
  const product: MineralProduct = {
    id: newId("product"),
    supplierId,
    name: `${values.commodity} ${values.productType.toLowerCase()}`,
    specification: {
      commodity: values.commodity,
      productType: values.productType,
      mineralForm: values.mineralForm,
      gradePercent: values.gradePercent,
      sulphurPercent: values.sulphurPercent,
      impurities: {},
      particleSizeMm: values.particleSizeMm,
    },
    availableQuantityMt: values.availableQuantityMt,
    monthlyCapacityMt: values.monthlyCapacityMt,
    trialQuantityMt: values.trialQuantityMt,
    loadingCountry: values.loadingCountry,
    loadingLocation: values.loadingLocation || undefined,
    availableForExport: values.availableForExport,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  workspace.products[supplierId] = [...(workspace.products[supplierId] ?? []), product];
  addActivity(workspace, supplierId, "PRODUCT_ADDED", "Product details recorded", `${product.name}; supplier-reported specification, not an independent assay.`);
  writeSupplierWorkspace(workspace);
}

export function addSupplierAssay(supplierId: string, productId: string, values: AssayValues): void {
  requireClientPermission("supplier.evidence.manage");
  const workspace = readSupplierWorkspace();
  const assay: SupplierAssay = {
    id: newId("assay"), supplierId, productId,
    source: values.source as AssaySource,
    gradePercent: values.gradePercent,
    sulphurPercent: values.sulphurPercent,
    arsenicPercent: values.arsenicPercent,
    chlorinePercent: values.chlorinePercent,
    cadmiumPercent: values.cadmiumPercent,
    mercuryPercent: values.mercuryPercent,
    fluorinePercent: values.fluorinePercent,
    leadPercent: values.leadPercent,
    zincPercent: values.zincPercent,
    particleSizeMm: values.particleSizeMm,
    laboratoryName: values.laboratoryName || undefined,
    certificateRef: values.certificateRef || undefined,
    testedAt: values.testedAt,
    notes: values.notes || undefined,
    createdAt: now(),
  };
  workspace.assays[supplierId] = [...(workspace.assays[supplierId] ?? []), assay];
  addActivity(workspace, supplierId, "ASSAY_RECEIVED", "Assay values recorded", `${assay.source} source; these values retain their stated source and are not automatically verified.`);
  writeSupplierWorkspace(workspace);
}

export function addSupplierDocument(supplierId: string, values: SupplierDocumentValues): void {
  requireClientPermission("supplier.evidence.manage");
  const workspace = readSupplierWorkspace();
  const document: SupplierDocumentRecord = {
    id: newId("document"), supplierId, ...values,
    reference: values.reference || undefined,
    issuedAt: values.issuedAt,
    expiresAt: values.expiresAt,
    notes: values.notes || undefined,
    storageState: "METADATA_ONLY",
    createdAt: now(),
  };
  workspace.documents[supplierId] = [...(workspace.documents[supplierId] ?? []), document];
  addActivity(workspace, supplierId, "DOCUMENT_RECORDED", "Document metadata recorded", `${document.name} · ${document.type}; no file uploaded.`);
  if (document.status === "VERIFIED") {
    addActivity(workspace, supplierId, "DOCUMENT_VERIFIED", "Document marked verified", `${document.name} was explicitly marked verified by an internal user.`);
  }
  writeSupplierWorkspace(workspace);
}

export function updateSupplierDocumentStatus(supplierId: string, documentId: string, status: SupplierDocumentRecord["status"]): void {
  requireClientPermission("supplier.evidence.manage");
  const workspace = readSupplierWorkspace();
  const document = (workspace.documents[supplierId] ?? []).find((item) => item.id === documentId);
  if (!document) return;
  const previous = document.status;
  document.status = status;
  addActivity(
    workspace,
    supplierId,
    status === "VERIFIED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_RECORDED",
    status === "VERIFIED" ? "Document marked verified" : "Document status changed",
    `${document.name}: ${previous} → ${status}`,
  );
  writeSupplierWorkspace(workspace);
}

export function updateVerificationCheck(supplierId: string, checkId: string, status: VerificationCheckStatus, note?: string): void {
  requireClientPermission("supplier.evidence.manage");
  const workspace = readSupplierWorkspace();
  const checks = workspace.checks[supplierId] ?? [];
  const check = checks.find((item) => item.id === checkId);
  if (!check) return;
  check.status = status;
  check.note = note?.trim() || undefined;
  check.updatedAt = now();
  addActivity(workspace, supplierId, "CHECK_UPDATED", "Verification check updated", `${check.label}: ${status}${check.note ? ` · ${check.note}` : ""}`);
  writeSupplierWorkspace(workspace);
}

export function updateSupplierVerification(supplierId: string, status: Supplier["verificationStatus"], reason: string): void {
  requireClientPermission("supplier.verify");
  if ((status === "VERIFIED" || status === "REJECTED") && reason.trim().length < 5) {
    throw new Error(`An internal reason of at least 5 characters is required to set ${status}.`);
  }
  const workspace = readSupplierWorkspace();
  const supplier = workspace.suppliers.find((item) => item.id === supplierId);
  if (!supplier) return;
  const previous = supplier.verificationStatus;
  supplier.verificationStatus = status;
  supplier.updatedAt = now();
  const event = status === "VERIFIED"
    ? { type: "VERIFICATION_COMPLETED" as const, title: "Verification decision completed" }
    : status === "REJECTED"
      ? { type: "SUPPLIER_REJECTED" as const, title: "Supplier verification rejected" }
      : status === "UNDER_REVIEW"
        ? { type: "VERIFICATION_STARTED" as const, title: "Verification review started" }
        : { type: "VERIFICATION_CHANGED" as const, title: "Verification decision changed" };
  addActivity(workspace, supplierId, event.type, event.title, `${previous} → ${status} · ${reason.trim()}`);
  writeSupplierWorkspace(workspace);
}

export function updateSupplierPipeline(supplierId: string, status: Supplier["pipelineStatus"]): void {
  requireClientPermission("supplier.pipeline.manage");
  const workspace = readSupplierWorkspace();
  const supplier = workspace.suppliers.find((item) => item.id === supplierId);
  if (!supplier) return;
  const previous = supplier.pipelineStatus;
  supplier.pipelineStatus = status;
  supplier.updatedAt = now();
  const event = status === "CONTACTED"
    ? { type: "SUPPLIER_CONTACTED" as const, title: "Pipeline moved to contacted" }
    : status === "DOCUMENTS_REQUESTED"
      ? { type: "DOCUMENTS_REQUESTED" as const, title: "Documents requested stage selected" }
      : status === "QUALIFIED"
        ? { type: "SUPPLIER_QUALIFIED" as const, title: "Supplier marked qualified" }
        : status === "REJECTED"
          ? { type: "PIPELINE_REJECTED" as const, title: "Supplier rejected from pipeline" }
          : { type: "PIPELINE_CHANGED" as const, title: "Pipeline stage changed" };
  const note = status === "CONTACTED" || status === "DOCUMENTS_REQUESTED"
    ? "; stage change does not send an external message"
    : "";
  addActivity(workspace, supplierId, event.type, event.title, `${previous} → ${status}${note}`);
  writeSupplierWorkspace(workspace);
}

export function recordBuyerMatch(supplierId: string, requirementTitle: string, status: string): void {
  requireClientPermission("match.audit");
  const workspace = readSupplierWorkspace();
  addActivity(workspace, supplierId, "BUYER_MATCH_PERFORMED", "Buyer match checked", `${requirementTitle}: ${status}. Match is not supplier verification or qualification.`);
  writeSupplierWorkspace(workspace);
}

export function updateSupplierOutreachStatus(supplierId: string, status: SupplierOutreachStatus): void {
  requireClientPermission("outreach.log");
  const workspace = readSupplierWorkspace();
  const supplier = workspace.suppliers.find((item) => item.id === supplierId);
  if (!supplier) return;
  const previous = workspace.outreachStatuses[supplierId] ?? "NOT_CONTACTED";
  if (previous === status) return;
  workspace.outreachStatuses[supplierId] = status;
  supplier.updatedAt = now();
  addActivity(workspace, supplierId, "OUTREACH_STATUS_CHANGED", "Outreach status changed", `${previous.replaceAll("_", " ")} → ${status.replaceAll("_", " ")}. This is separate from verification and pipeline stage.`);
  writeSupplierWorkspace(workspace);
}

function createFollowUpRecord({
  workspace,
  supplierId,
  dueAt,
  priority,
  owner,
  action,
  contactId,
  communicationId,
  informationRequestId,
  isDemoFixture = false,
}: {
  workspace: SupplierWorkspace;
  supplierId: string;
  dueAt: string;
  priority: FollowUpPriority;
  owner?: string;
  action: string;
  contactId?: string;
  communicationId?: string;
  informationRequestId?: string;
  isDemoFixture?: boolean;
}): SupplierFollowUp {
  const followUp: SupplierFollowUp = {
    id: newId("follow-up"), supplierId, contactId, communicationId, informationRequestId,
    dueAt, priority, owner: owner?.trim() || "Unassigned", action: action.trim(),
    status: "OPEN", isDemoFixture, createdAt: now(),
  };
  workspace.followUps.unshift(followUp);
  return followUp;
}

export function logSupplierCommunication(supplierId: string, values: CommunicationValues): void {
  requireClientPermission("outreach.log");
  const workspace = readSupplierWorkspace();
  const communication: SupplierCommunication = {
    id: newId("communication"),
    supplierId,
    type: values.type as CommunicationType,
    direction: values.direction as CommunicationDirection,
    contactId: values.contactId || undefined,
    requirementId: values.requirementId || undefined,
    occurredAt: new Date(values.occurredAt).toISOString(),
    subject: values.subject,
    summary: values.summary,
    outcome: values.outcome || undefined,
    nextAction: values.nextAction || undefined,
    followUpDate: values.followUpDate,
    internalNotes: values.internalNotes || undefined,
    deliveryStatus: "NOT_SENT",
    isDemoFixture: false,
    createdAt: now(),
  };
  workspace.communications[supplierId] = [communication, ...(workspace.communications[supplierId] ?? [])];
  const previousOutreachStatus = workspace.outreachStatuses[supplierId] ?? "NOT_CONTACTED";
  const nextOutreachStatus = communication.direction === "INBOUND" ? "RESPONDED" : "OUTREACH_SENT";
  workspace.outreachStatuses[supplierId] = nextOutreachStatus;
  const statusDetail = previousOutreachStatus === nextOutreachStatus
    ? ""
    : ` Outreach status: ${previousOutreachStatus.replaceAll("_", " ")} → ${nextOutreachStatus.replaceAll("_", " ")}.`;
  addActivity(
    workspace,
    supplierId,
    "COMMUNICATION_LOGGED",
    communication.direction === "INBOUND" ? "Supplier response recorded" : "Communication logged",
    `${communication.type} · ${communication.direction} · ${communication.subject}. Internal record only; MineralLink did not send an external message.${statusDetail}`,
  );
  if (communication.followUpDate && communication.nextAction) {
    const followUp = createFollowUpRecord({
      workspace,
      supplierId,
      dueAt: `${communication.followUpDate.slice(0, 10)}T17:00:00.000Z`,
      priority: values.followUpPriority,
      owner: values.followUpOwner,
      action: communication.nextAction,
      contactId: communication.contactId,
      communicationId: communication.id,
    });
    addActivity(workspace, supplierId, "FOLLOW_UP_SCHEDULED", "Follow-up scheduled", `${followUp.action} · due ${followUp.dueAt.slice(0, 10)} · ${followUp.priority}`);
  }
  writeSupplierWorkspace(workspace);
}

export function createInformationRequest(
  supplierId: string,
  values: InformationRequestValues,
  draftMessage: string,
): void {
  requireClientPermission("information.manage");
  const workspace = readSupplierWorkspace();
  const request: SupplierInformationRequest = {
    id: newId("information-request"),
    supplierId,
    contactId: values.contactId || undefined,
    requirementId: values.requirementId || undefined,
    itemIds: values.itemIds,
    requestedAt: now(),
    dueAt: values.dueAt,
    internalNote: values.internalNote || undefined,
    draftMessage,
    deliveryStatus: "NOT_SENT",
    isDemoFixture: false,
    createdAt: now(),
  };
  workspace.informationRequests.unshift(request);
  const supplierStatuses = workspace.informationStatuses[supplierId] ?? Object.fromEntries(INFORMATION_REQUEST_ITEMS.map((item) => [item.id, "NOT_REQUESTED"])) as Record<InformationRequestItemId, InformationItemStatus>;
  for (const itemId of request.itemIds) supplierStatuses[itemId] = "REQUESTED";
  workspace.informationStatuses[supplierId] = supplierStatuses;
  addActivity(workspace, supplierId, "INFORMATION_REQUESTED", "Information request prepared", `${request.itemIds.length} information items selected. Draft saved locally; it was not sent.`);
  if (request.dueAt) {
    const followUp = createFollowUpRecord({
      workspace,
      supplierId,
      dueAt: `${request.dueAt.slice(0, 10)}T17:00:00.000Z`,
      priority: values.followUpPriority,
      owner: values.followUpOwner,
      action: "Follow up on requested supplier information",
      contactId: request.contactId,
      informationRequestId: request.id,
    });
    addActivity(workspace, supplierId, "FOLLOW_UP_SCHEDULED", "Follow-up scheduled", `${followUp.action} · due ${followUp.dueAt.slice(0, 10)} · ${followUp.priority}`);
  }
  writeSupplierWorkspace(workspace);
}

export function updateInformationItemStatus(
  supplierId: string,
  itemId: InformationRequestItemId,
  status: InformationItemStatus,
): void {
  requireClientPermission("information.manage");
  const workspace = readSupplierWorkspace();
  const statuses = workspace.informationStatuses[supplierId];
  if (!statuses || statuses[itemId] === status) return;
  const previous = statuses[itemId];
  statuses[itemId] = status;
  const label = INFORMATION_REQUEST_ITEMS.find((item) => item.id === itemId)?.label ?? itemId;
  const received = status === "RECEIVED";
  addActivity(
    workspace,
    supplierId,
    received ? "INFORMATION_RECEIVED" : "INFORMATION_STATUS_CHANGED",
    received ? "Information marked received" : "Information collection status changed",
    `${label}: ${previous.replaceAll("_", " ")} → ${status.replaceAll("_", " ")}. Receipt is not document or assay verification.`,
  );
  writeSupplierWorkspace(workspace);
}

export function updateFollowUpStatus(followUpId: string, status: FollowUpStatus): void {
  requireClientPermission("followup.manage");
  const workspace = readSupplierWorkspace();
  const followUp = workspace.followUps.find((item) => item.id === followUpId);
  if (!followUp || followUp.status !== "OPEN") return;
  followUp.status = status;
  if (status === "COMPLETED") followUp.completedAt = now();
  const title = status === "COMPLETED" ? "Follow-up completed" : "Follow-up cancelled";
  addActivity(workspace, followUp.supplierId, status === "COMPLETED" ? "FOLLOW_UP_COMPLETED" : "FOLLOW_UP_CANCELLED", title, `${followUp.action} · ${status}`);
  writeSupplierWorkspace(workspace);
}
