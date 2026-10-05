import type { BuyerRequirement, Supplier } from "@/lib/domain";
import { INFORMATION_REQUEST_ITEMS } from "@/lib/domain/supplier-workflow";

export const OUTREACH_TEMPLATES = [
  { id: "INITIAL_INTRODUCTION", label: "Initial supplier introduction" },
  { id: "PRODUCT_INFORMATION", label: "Product information request" },
  { id: "DOCUMENT_REQUEST", label: "Document request" },
  { id: "FOLLOW_UP", label: "Follow-up" },
  { id: "ASSAY_CLARIFICATION", label: "Assay clarification" },
  { id: "COMMERCIAL_TERMS", label: "Commercial terms clarification" },
] as const;

export type OutreachTemplateId = (typeof OUTREACH_TEMPLATES)[number]["id"];

export interface OutreachDraft {
  subject: string;
  body: string;
}

const elementSymbols = { COPPER: "Cu", LEAD: "Pb", ZINC: "Zn", NICKEL: "Ni" } as const;

function requirementContext(requirement?: BuyerRequirement): string {
  if (!requirement) return "";
  const gradeSymbol = elementSymbols[requirement.commodity];
  const trial = requirement.trialQuantityMinMt !== undefined && requirement.trialQuantityMaxMt !== undefined
    ? `${requirement.trialQuantityMinMt}-${requirement.trialQuantityMaxMt} MT`
    : "to be discussed";
  return [
    `Relevant sourcing context: ${requirement.commodity} ${requirement.productType} for ${requirement.destinationCountry}.`,
    `${gradeSymbol} >= ${requirement.minimumGradePercent}%${requirement.minimumSulphurPercent === undefined ? "" : `; S >= ${requirement.minimumSulphurPercent}%`}.`,
    `Trial ${trial}; monthly >= ${requirement.monthlyQuantityMt.toLocaleString("en-US")} MT.`,
    "This is a high-level fit context only; no buyer identity, pricing, or confidential buyer information is included.",
  ].join("\n");
}

export function buildOutreachDraft({
  template,
  supplier,
  contactName,
  requirement,
  requestedItemIds = [],
}: {
  template: OutreachTemplateId;
  supplier: Supplier;
  contactName?: string;
  requirement?: BuyerRequirement;
  requestedItemIds?: string[];
}): OutreachDraft {
  const greeting = contactName ? `Hello ${contactName},` : "Hello,";
  const company = supplier.tradingName || supplier.companyName;
  const context = requirementContext(requirement);
  const itemText = requestedItemIds
    .flatMap((id) => {
      const item = INFORMATION_REQUEST_ITEMS.find((entry) => entry.id === id);
      return item ? [item.label] : [];
    });

  const drafts: Record<OutreachTemplateId, OutreachDraft> = {
    INITIAL_INTRODUCTION: {
      subject: `Mineral supply enquiry - ${company}`,
      body: `${greeting}\n\nWe are currently sourcing mineral supply opportunities for an active commercial requirement. We would welcome an introduction to the appropriate sales contact and an initial overview of your current supply position.\n\nIf available, please share:\n- Current assay and inspection documentation\n- Commodity and product type\n- Grade, sulphur, and available impurity data\n- Available quantity, monthly capacity, and trial quantity\n- Material origin and loading location\n- Export capability and applicable export documentation\n- SGS, CCIC, or other inspection documentation\n- Pricing basis and supported Incoterms\n- Name and contact details for your sales representative\n\n${context ? `${context}\n\n` : ""}This enquiry is for initial screening only. No commitment or representation of a specific buyer is implied.\n\nRegards,\nNjapa Projects`,
    },
    PRODUCT_INFORMATION: {
      subject: `Product and supply information - ${company}`,
      body: `${greeting}\n\nPlease provide your current product specification and supply position, including commodity, product type, grade, sulphur, available impurity data, quantity available, monthly capacity, trial quantity, origin, loading location, and export capability. Please identify which values are supplier-reported and attach or reference any current assay.\n\n${context ? `${context}\n\n` : ""}Regards,\nNjapa Projects`,
    },
    DOCUMENT_REQUEST: {
      subject: `Information and document request - ${company}`,
      body: `${greeting}\n\nTo continue our initial supplier review, could you provide or advise availability for the following items?\n${(itemText.length ? itemText : INFORMATION_REQUEST_ITEMS.map((item) => item.label)).map((item) => `- ${item}`).join("\n")}\n\n${context ? `${context}\n\n` : ""}Please let us know if any item is unavailable or not applicable. This request does not imply that any document has been received or verified.\n\nRegards,\nNjapa Projects`,
    },
    FOLLOW_UP: {
      subject: `Follow-up - ${company}`,
      body: `${greeting}\n\nI am following up on our previous mineral supply enquiry. Please let us know whether the opportunity is of interest and when we might expect the requested information.\n\n${context ? `${context}\n\n` : ""}Thank you,\nNjapa Projects`,
    },
    ASSAY_CLARIFICATION: {
      subject: `Assay clarification - ${company}`,
      body: `${greeting}\n\nCould you please clarify the source and date of the assay provided, the laboratory or inspection body involved, and whether a current certificate reference is available? Please also confirm which figures are measured values and which are indicative estimates.\n\n${context ? `${context}\n\n` : ""}Regards,\nNjapa Projects`,
    },
    COMMERCIAL_TERMS: {
      subject: `Commercial terms clarification - ${company}`,
      body: `${greeting}\n\nPlease advise your pricing basis, quotation validity, minimum and trial quantities, monthly availability, supported Incoterms, loading point, payment expectations, and any inspection requirements.\n\n${context ? `${context}\n\n` : ""}This is an information request only and is not an offer or commitment.\n\nRegards,\nNjapa Projects`,
    },
  };

  return drafts[template];
}
