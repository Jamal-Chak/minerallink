// Phase 7 pure tests part 1: mapping + errors + mode.
// Run: npx tsx scripts/test-phase7-persistence.ts
import { toDecimalString, fromDecimal, toDate, fromDate } from "../lib/repositories/prisma/decimal-mapping";
import { mapSupplierToPrisma, mapPrismaToSupplier } from "../lib/repositories/prisma/supplier-mapper";
import { mapProductToPrisma, mapPrismaToProduct } from "../lib/repositories/prisma/product-mapper";
import { mapAssayToPrisma, mapPrismaToAssay } from "../lib/repositories/prisma/evidence-mapper";
import { toPersistenceError } from "../lib/repositories/persistence-errors";
import { getPersistenceMode } from "../lib/repositories/persistence-mode";
import { initialWorkspace } from "../lib/data/workspace-model";

let passed = 0;
let failed = 0;
export function check(condition: boolean, label: string): void {
  if (condition) {
    passed += 1;
    console.log(`  ok - ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL - ${label}`);
  }
}
export function summary(): void {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

console.log("\n=== decimal round-trip (integer-safe) ===");
check(toDecimalString(185) === "185", "price 185 -> exact string");
check(toDecimalString(undefined) === undefined, "undefined stays undefined");
let threw = false;
try {
  toDecimalString(-5);
} catch {
  threw = true;
}
check(threw, "negative money rejected before Prisma");
check(fromDecimal({ toString: () => "11550" }) === 11550, "Decimal string -> number");
check(fromDecimal(null) === undefined, "null Decimal -> undefined");
const d = toDate("2026-10-06T00:00:00.000Z");
check(d instanceof Date && d.toISOString() === "2026-10-06T00:00:00.000Z", "ISO string -> Date");
check(fromDate(new Date("2026-10-06T00:00:00.000Z")) === "2026-10-06T00:00:00.000Z", "Date -> ISO string");

console.log("\n=== supplier mapping (nullable + metadata) ===");
const seed = initialWorkspace();
const first = seed.suppliers[0];
const mapped = mapSupplierToPrisma(first, seed.metadata[first.id], seed.outreachStatuses[first.id]);
check(mapped.supplier.companyName === first.companyName, "company name preserved");
check(mapped.contacts.length === first.contacts.length, "embedded contacts mapped to rows");
check(mapped.supplier.tradingName === (first.tradingName ?? null), "nullable tradingName mapped");
const back = mapPrismaToSupplier(
  { ...mapped.supplier, supplyCountry: mapped.supplier.supplyCountry ?? first.country, createdAt: new Date(first.createdAt), updatedAt: new Date(first.updatedAt) },
  mapped.contacts,
);
check(back.supplier.companyName === first.companyName, "supplier round-trip preserves name");
check(back.metadata.source === (seed.metadata[first.id]?.source ?? "Unspecified"), "workflow metadata survives");
check(back.outreachStatus === (seed.outreachStatuses[first.id] ?? "NOT_CONTACTED"), "outreach status survives");

console.log("\n=== product / assay ===");
const product = seed.products[first.id][0];
const productBack = mapPrismaToProduct({ ...mapProductToPrisma(product), createdAt: new Date(), updatedAt: new Date() });
check(productBack.specification.gradePercent === product.specification.gradePercent, "grade round-trips");
const syntheticAssay = {
  id: "phase7-assay-001", supplierId: first.id, productId: product.id,
  source: "SGS" as const, gradePercent: 18.4, sulphurPercent: 27.1,
  arsenicPercent: 0.21, laboratoryName: "SGS Lab", createdAt: new Date().toISOString(),
};
const assayBack = mapPrismaToAssay({ ...mapAssayToPrisma(syntheticAssay), createdAt: new Date() }, first.id);
check(assayBack.gradePercent === syntheticAssay.gradePercent, "assay grade round-trips");
check(assayBack.supplierId === first.id, "assay supplierId derived through product");

console.log("\n=== error mapping (no leaks) ===");
check(toPersistenceError({ code: "P2002" }).code === "CONFLICT", "P2002 -> CONFLICT");
check(toPersistenceError({ code: "P2025" }).code === "NOT_FOUND", "P2025 -> NOT_FOUND");
check(toPersistenceError({ code: "ETIMEDOUT" }).code === "DATABASE_UNAVAILABLE", "timeout -> DATABASE_UNAVAILABLE");
const unknown = toPersistenceError(new Error("postgres://secret@host/db exploded"));
check(unknown.code === "UNKNOWN" && !unknown.message.includes("postgres"), "unknown errors redacted");

console.log("\n=== persistence mode ===");
check(getPersistenceMode({ MINERALLINK_PERSISTENCE_MODE: "server" } as unknown as NodeJS.ProcessEnv) === "server", "explicit server mode");
check(getPersistenceMode({} as unknown as NodeJS.ProcessEnv) === "browser", "default is browser");

export { passed, failed };
