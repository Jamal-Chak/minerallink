// Phase 7 pure tests part 2: CRM/deal/finance/match, validation, preview,
// authorization matrix (static Phase 5). Run after part 1 in
// scripts/test-phase7-persistence.ts via tsx.
import { check } from "./test-phase7-a-mapping";
import { mapDocumentToPrisma, mapPrismaToDocument } from "../lib/repositories/prisma/evidence-mapper";
import { mapCommunicationToPrisma, mapPrismaToCommunication } from "../lib/repositories/prisma/crm-mapper";
import { mapFollowUpToPrisma, mapPrismaToFollowUp } from "../lib/repositories/prisma/followup-mapper";
import { mapDealToPrisma, mapPrismaToDeal } from "../lib/repositories/prisma/deal-mapper";
import { mapPaymentToPrisma, mapPrismaToPayment } from "../lib/repositories/prisma/finance-mapper";
import { mapCommissionToPrisma, mapPrismaToCommission } from "../lib/repositories/prisma/finance-mapper";
import { buildMatchSnapshot, snapshotToJson } from "../lib/repositories/prisma/match-mapper";
import { previewWorkspaceImport } from "../lib/repositories/server-import";
import { serverVerificationSchema, serverCommissionSchema } from "../lib/repositories/prisma/server-commands";
import { initialWorkspace } from "../lib/data/workspace-model";
import { can } from "../lib/auth/permissions";
import { DEVELOPMENT_USERS } from "../lib/auth/dev-users";

const seed = initialWorkspace();
const first = seed.suppliers[0];
const deal = seed.deals[0];

console.log("\n=== documents / CRM / deals / finance ===");
const syntheticDoc = {
  id: "phase7-doc-001", supplierId: first.id, type: "SGS_REPORT" as const,
  name: "Synthetic SGS report", status: "UNVERIFIED" as const,
  storageState: "METADATA_ONLY" as const, createdAt: new Date().toISOString(),
};
check(mapPrismaToDocument({ ...mapDocumentToPrisma(syntheticDoc), createdAt: new Date() }).storageState === "METADATA_ONLY", "document storage state fixed");
const comm = seed.communications[first.id]?.[0];
if (comm) {
  check(mapPrismaToCommunication({ ...mapCommunicationToPrisma(comm), createdAt: new Date() }).subject === comm.subject, "communication round-trip");
}
const followUp = seed.followUps[0];
if (followUp) {
  check(mapPrismaToFollowUp({ ...mapFollowUpToPrisma(followUp), createdAt: new Date() }).action === followUp.action, "follow-up round-trip");
}
const dealRow = mapDealToPrisma(deal, seed.dealMetadata[deal.id]);
const dealBack = mapPrismaToDeal({ ...dealRow, createdAt: new Date(deal.createdAt), updatedAt: new Date(deal.updatedAt) });
check(dealBack.deal.status === deal.status, "deal status round-trips");
check(dealBack.metadata.supplyType === seed.dealMetadata[deal.id]?.supplyType, "deal metadata survives");
if (seed.paymentMilestones.length > 0) {
  const pay = seed.paymentMilestones[0];
  check(mapPrismaToPayment({ ...mapPaymentToPrisma(pay), createdAt: new Date(), updatedAt: new Date() }).milestone === pay.milestone, "payment round-trips");
} else {
  const syntheticPay = {
    id: "phase7-pay-001", dealId: deal.id, milestone: "Advance",
    expectedPercentage: 30, currency: "USD", status: "NOT_DUE" as const,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  check(mapPrismaToPayment({ ...mapPaymentToPrisma(syntheticPay), createdAt: new Date(), updatedAt: new Date() }).milestone === "Advance", "payment round-trips");
}
const commission = seed.commissions[deal.id];
if (commission) {
  check(mapPrismaToCommission(mapCommissionToPrisma(commission), commission.updatedAt).status === commission.status, "commission round-trips");
}

console.log("\n=== match snapshot (immutable evidence) ===");
const snapshot = buildMatchSnapshot({
  id: "match-snap-1", dealId: deal.id,
  result: { productId: deal.productId, requirementId: deal.requirementId, status: "MATCH", checks: [], passed: 3, failed: 0, missing: 0 },
});
check(snapshotToJson(snapshot).status === "MATCH", "snapshot serializes to JSON");

console.log("\n=== server validation ===");
check(serverVerificationSchema.safeParse({ supplierId: "s1", status: "VERIFIED", reason: "ok reason here" }).success, "verification with reason passes");
check(!serverVerificationSchema.safeParse({ supplierId: "s1", status: "VERIFIED", reason: "x" }).success, "short reason rejected");
check(!serverCommissionSchema.safeParse({ dealId: "d1", type: "PERCENTAGE" }).success, "percentage commission without value rejected");

console.log("\n=== import preview (dry-run) ===");
const envelope = { format: "minerallink.supplier-workspace", version: 3, exportedAt: new Date().toISOString(), workspace: seed };
const { preview } = previewWorkspaceImport(envelope);
check(preview.suppliersToCreate === seed.suppliers.length, "preview counts suppliers");
check(preview.dealsToCreate === seed.deals.length, "preview counts deals");
check(preview.validationErrors.length === 0, "seed preview has no validation errors");
check(previewWorkspaceImport({ broken: true }).preview.validationErrors.length > 0, "malformed payload reported");

console.log("\n=== authorization matrix (static Phase 5) ===");
const byId = new Map(DEVELOPMENT_USERS.map((u) => [u.id, u]));
check(can(byId.get("dev-admin"), "deal.create") === true, "ADMIN broad access");
check(can(byId.get("dev-sourcing-manager"), "supplier.pipeline.manage") === true, "SOURCING_MANAGER pipeline allowed");
check(can(byId.get("dev-sourcing-agent"), "payment.manage") === false, "SOURCING_AGENT payment denied");
check(can(byId.get("dev-verification-analyst"), "supplier.verify") === true, "VERIFICATION_ANALYST verify allowed");
check(can(byId.get("dev-verification-analyst"), "supplier.pipeline.manage") === false, "VERIFICATION_ANALYST no pipeline privilege");
check(can(byId.get("dev-commercial-manager"), "commission.edit") === true, "COMMERCIAL_MANAGER commercial allowed");
check(can(byId.get("dev-viewer"), "deal.create") === false, "VIEWER read-only");
