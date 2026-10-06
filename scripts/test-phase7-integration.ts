// Phase 7 integration tests — run ONLY when the database is proven safe and
// reachable. Uses synthetic ids with the `phase7-` prefix and removes ONLY
// those exact rows afterwards. Never truncates, never touches other rows.
//
// Run: PHASE7_RUN_DB_TESTS=1 npx tsx scripts/test-phase7-integration.ts
// Without the flag (or without connectivity) it reports SKIP, never failure.
import { prisma } from "../lib/db";
import { createSupplierRecord, readSupplierAggregate } from "../lib/repositories/prisma-supplier-operations";
import { transitionSupplierVerification } from "../lib/repositories/prisma-crm-operations";
import { addDocumentRecord } from "../lib/repositories/prisma-document-operations";
import { createDealRecord, readDealAggregate } from "../lib/repositories/prisma-deal-operations";
import { createPaymentMilestoneRecord } from "../lib/repositories/prisma-deal-logistics-operations";

const PREFIX = "phase7-";
const actor = { id: "dev-admin", name: "Admin User" };

async function main(): Promise<void> {
  if (process.env.PHASE7_RUN_DB_TESTS !== "1") {
    console.log("SKIP: set PHASE7_RUN_DB_TESTS=1 to run database integration tests against a proven-safe database.");
    return;
  }
  const supplierId = `${PREFIX}supplier-001`;
  const dealId = `${PREFIX}deal-001`;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.log("SKIP: database unreachable; integration tests deferred (browser fallback unaffected).");
    return;
  }
  try {
    const created = await createSupplierRecord(prisma, {
      id: supplierId,
      companyName: "Phase 7 Synthetic Supplier",
      country: "Zambia",
      supplierType: "PRODUCER",
      contactName: "Synthetic Contact",
      source: "phase7-integration",
      supplyCountry: "Zambia",
      availableForExport: true,
      actor,
    });
    console.log(`  ok - created synthetic supplier ${created}`);
    const aggregate = await readSupplierAggregate(prisma, supplierId);
    if (!aggregate) throw new Error("synthetic supplier not readable");
    console.log("  ok - read supplier aggregate");
    await transitionSupplierVerification(prisma, {
      supplierId,
      status: "UNDER_REVIEW",
      reason: "phase7 integration probe",
      actor,
    });
    console.log("  ok - verification transition with audit");
    await addDocumentRecord(prisma, {
      document: { supplierId, type: "OTHER", name: "Phase 7 probe doc", status: "UNVERIFIED" },
      actor,
    });
    console.log("  ok - document metadata recorded");
    console.log("  SKIP - deal lifecycle steps require Buyer/Product/Requirement reference rows; deferred until migration is applied.");
    void createDealRecord;
    void readDealAggregate;
    void createPaymentMilestoneRecord;
    void dealId;
  } finally {
    await prisma.supplierActivity.deleteMany({ where: { supplierId } });
    await prisma.supplierDocument.deleteMany({ where: { supplierId } });
    await prisma.supplierContact.deleteMany({ where: { supplierId } });
    await prisma.supplier.deleteMany({ where: { id: supplierId } });
    console.log("  ok - synthetic rows removed (exact ids only)");
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Integration test failed safely (no unrelated rows touched).");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
