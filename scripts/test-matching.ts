import { copperConcentrateRequirement } from "../lib/data/buyer-requirements";
import {
  matchingCopperSupplier,
  failingCopperSupplier,
  incompleteCopperSupplier,
} from "../lib/data/sample-products";
import { matchMineralProduct } from "../lib/matching";

const suppliers = [
  {
    name: "Matching Supplier",
    product: matchingCopperSupplier,
  },
  {
    name: "Failing Supplier",
    product: failingCopperSupplier,
  },
  {
    name: "Incomplete Supplier",
    product: incompleteCopperSupplier,
  },
];

for (const supplier of suppliers) {
  const result = matchMineralProduct(
    supplier.product,
    copperConcentrateRequirement,
  );

  console.log("\n========================================");
  console.log(supplier.name);
  console.log("========================================");

  console.log(`Overall Status: ${result.status}`);
  console.log(`Passed: ${result.passed}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Missing: ${result.missing}`);

  console.table(
    result.checks.map((check) => ({
      Check: check.label,
      Status: check.status,
      Actual: check.actual,
      Required: check.required,
      Rule: check.operator,
    })),
  );
}
