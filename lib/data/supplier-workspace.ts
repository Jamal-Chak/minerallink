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
import { checkDefinitions, initialWorkspace, type SupplierWorkspace } from "@/lib/data/workspace-model";
import { getWorkspaceRepository } from "@/lib/repositories";

export type { SupplierWorkspace };

function newId(prefix: string): string {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${id}`;
}

function now(): string {
  return new Date().toISOString();
}

export function getSeededSupplierWorkspace(): SupplierWorkspace {
  return initialWorkspace();
}

export function readSupplierWorkspace(): SupplierWorkspace {
  return getWorkspaceRepository().read();
}

function writeSupplierWorkspace(workspace: SupplierWorkspace): void {
  getWorkspaceRepository().write(workspace);
}

export function subscribeToSupplierWorkspace(onChange: () => void): () => void {
  return getWorkspaceRepository().subscribe(onChange);
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
