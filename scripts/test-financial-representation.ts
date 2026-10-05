// Phase 6 — financial representation tests.
// Money is integer minor units end-to-end; these tests prove no float drift.
// Run: npx tsx scripts/test-financial-representation.ts
import {
  calculateDealValue,
  calculateEstimatedCommission,
  sumCurrencyAmounts,
  sumCurrencyValues,
  toMinorUnits,
} from "../lib/utils/commercial-math";

let passed = 0;
let failed = 0;
function check(condition: boolean, label: string): void {
  if (condition) {
    passed += 1;
    console.log(`  ok - ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL - ${label}`);
  }
}

console.log("\n=== decimal → integer minor units ===");
check(toMinorUnits(1234.56) === BigInt(123456), "1234.56 → 123456 minor units");
check(toMinorUnits(0.3) === BigInt(30), "0.3 → 30 minor units");
check(toMinorUnits(0.1 + 0.2) === BigInt(30), "float-imprecise 0.1+0.2 still → 30 minor units");
check(toMinorUnits(undefined) === undefined, "undefined stays undefined");
check(toMinorUnits(0) === BigInt(0), "zero → zero");

console.log("\n=== currency sums (no float drift) ===");
check(
  JSON.stringify(sumCurrencyAmounts([{ amount: 0.1, currency: "USD" }, { amount: 0.2, currency: "USD" }])) === JSON.stringify(["USD 0.30"]),
  "0.1 + 0.2 → USD 0.30",
);
check(
  JSON.stringify(sumCurrencyAmounts([{ amount: 10.05 }, { amount: 5.5, currency: "EUR" }, { amount: 2.45, currency: "EUR" }]))
    === JSON.stringify(["USD 10.05", "EUR 7.95"]),
  "per-currency totals grouped correctly",
);
check(
  JSON.stringify(sumCurrencyValues(["USD 12.34", "USD 56.78", "EUR 1.11"])) === JSON.stringify(["USD 69.12", "EUR 1.11"]),
  "formatted amounts re-sum to USD 69.12 / EUR 1.11",
);

console.log("\n=== deal value & commission ===");
check(calculateDealValue(80, 185) === "USD 14800.00", "80 MT @ 185 → USD 14800.00");
check(calculateDealValue(100.5, 99.99) === "USD 10049.00", "100.5 MT @ 99.99 → USD 10049.00 (rounded from x.995)");
check(calculateDealValue(undefined, 185) === undefined, "missing quantity → undefined (no fake numbers)");
check(
  calculateEstimatedCommission({ quantityMt: 100, pricePerMt: 200, percentage: 2.5 }) === "USD 500.00",
  "2.5% of USD 20000 → USD 500.00",
);
check(
  calculateEstimatedCommission({ fixedAmount: 1500.55, currency: "EUR" }) === "EUR 1500.55",
  "fixed commission preserved exactly",
);
check(calculateEstimatedCommission({ quantityMt: 100, pricePerMt: 200 }) === undefined, "missing percentage → undefined");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
