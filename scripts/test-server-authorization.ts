// Phase 6 — server-side authorization hook tests (reuses Phase 5 matrix).
// Run: npx tsx scripts/test-server-authorization.ts
(process.env as { NODE_ENV?: string }).NODE_ENV = "development";

import { PermissionDeniedError } from "../lib/auth/permissions";
import {
  requireServerPermission,
  requireServerSession,
  resolveServerSession,
} from "../lib/auth/server-authorization";

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

console.log("\n=== session resolution (development cookie values) ===");
const admin = resolveServerSession("dev-admin");
check(admin?.id === "dev-admin" && admin.role === "ADMIN", "admin cookie resolves to ADMIN user");
check(resolveServerSession("dev-unknown") === null, "unknown cookie resolves to null");
check(resolveServerSession(undefined) === null, "missing cookie resolves to null");
check(resolveServerSession(null) === null, "null cookie resolves to null");

console.log("\n=== requireServerSession ===");
check(requireServerSession("dev-sourcing-manager").role === "SOURCING_MANAGER", "valid cookie returns active user");
let threw = false;
try {
  requireServerSession(undefined);
} catch (error) {
  threw = error instanceof Error && error.message.includes("active development session");
}
check(threw, "missing session throws the session-required error");

console.log("\n=== requireServerPermission (Phase 5 matrix) ===");
check(requireServerPermission("dev-admin", "user.manage").id === "dev-admin", "admin passes user.manage");
check(requireServerPermission("dev-sourcing-manager", "deal.create").id === "dev-sourcing-manager", "sourcing manager passes deal.create");
threw = false;
try {
  requireServerPermission("dev-viewer", "user.manage");
} catch (error) {
  threw = error instanceof PermissionDeniedError && error.permission === "user.manage";
}
check(threw, "viewer denied user.manage with PermissionDeniedError");
threw = false;
try {
  requireServerPermission("dev-sourcing-agent", "payment.manage");
} catch (error) {
  threw = error instanceof PermissionDeniedError && error.permission === "payment.manage";
}
check(threw, "sourcing agent denied payment.manage");
threw = false;
try {
  requireServerPermission(undefined, "supplier.read");
} catch (error) {
  threw = error instanceof Error && !(error instanceof PermissionDeniedError);
}
check(threw, "no session throws session-required error (not PermissionDeniedError)");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
