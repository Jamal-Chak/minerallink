// Phase 6 — export/import validation and strategy tests.
// Run: npx tsx scripts/test-workspace-transfer.ts
import {
  WORKSPACE_EXPORT_FORMAT,
  exportWorkspace,
  exportWorkspaceJson,
  importWorkspace,
  validateWorkspaceImport,
  WorkspaceImportError,
} from "../lib/data/workspace-transfer";
import { PermissionDeniedError } from "../lib/auth/permissions";
import { readSupplierWorkspace } from "../lib/data/supplier-workspace";
import type { SupplierWorkspace } from "../lib/data/workspace-model";

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

class FakeStorage {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}
const storage = new FakeStorage();
(globalThis as unknown as { window?: unknown }).window = {
  localStorage: storage,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
};
if (typeof (globalThis as { CustomEvent?: unknown }).CustomEvent === "undefined") {
  (globalThis as { CustomEvent?: unknown }).CustomEvent = class CustomEventPolyfill {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
}
function signIn(userId: string): void {
  storage.setItem("minerallink:dev-session", userId);
}
signIn("dev-admin");
// Converge seeded storage first, exactly like a real page load would.
readSupplierWorkspace();

console.log("\n=== export ===");
const envelope = exportWorkspace();
check(envelope.format === WORKSPACE_EXPORT_FORMAT, "export carries the format marker");
check(envelope.version === 3, "export carries workspace version 3");
check(!Number.isNaN(Date.parse(envelope.exportedAt)), "export carries a parseable timestamp");
check(envelope.workspace.version === 3, "exported workspace is version 3");
const json = exportWorkspaceJson();
check(typeof json === "string" && json.length > 0, "exportWorkspaceJson serializes");

console.log("\n=== validation accepts real exports ===");
/** Order-insensitive deep stringify: validation may reorder keys (zod loose
 * objects emit schema keys first) but must never add or lose data. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}
const roundTrip = validateWorkspaceImport(JSON.parse(json));
check(roundTrip.ok === true, "JSON round-trip payload validates");
if (roundTrip.ok) {
  check(canonical(roundTrip.workspace) === canonical(envelope.workspace), "validation is idempotent on exported data (no data added or lost)");
}

console.log("\n=== validation rejects malformed payloads ===");
const workspace = JSON.parse(JSON.stringify(envelope.workspace)) as SupplierWorkspace;
const badCases: Array<[string, unknown]> = [
  ["null payload", null],
  ["missing format", { version: 3, exportedAt: envelope.exportedAt, workspace }],
  ["wrong format", { ...envelope, format: "some-other-tool" }],
  ["out-of-range version", { ...envelope, version: 99 }],
  ["non-object workspace", { ...envelope, workspace: "nope" }],
  ["workspace without suppliers", { ...envelope, workspace: { version: 3 } }],
  ["supplier missing companyName", { ...envelope, workspace: { ...workspace, suppliers: [{ id: "s1" }] } }],
  ["invalid pipeline status", { ...envelope, workspace: { ...workspace, suppliers: [{ ...workspace.suppliers[0], pipelineStatus: "NOT_A_STAGE" }] } }],
  ["invalid follow-up dueAt", { ...envelope, workspace: { ...workspace, followUps: [{ id: "f1", supplierId: "s1", dueAt: "not-a-date", priority: "HIGH", owner: "x", action: "y", status: "OPEN", createdAt: "2026-01-01T00:00:00.000Z" }] } }],
  ["invalid activity type", { ...envelope, workspace: { ...workspace, activities: { s1: [{ id: "a1", supplierId: "s1", type: "NOT_AN_ACTIVITY", title: "t", details: "d", createdAt: "2026-01-01T00:00:00.000Z" }] } } }],
];
for (const [label, payload] of badCases) {
  const result = validateWorkspaceImport(payload);
  check(result.ok === false && !result.ok && result.errors.length > 0, `rejects ${label}`);
}
console.log("\n=== import: replace strategy ===");
const replacePayload = JSON.parse(JSON.stringify(envelope)) as typeof envelope;
const firstId = replacePayload.workspace.suppliers[0].id;
const firstCreated = replacePayload.workspace.suppliers[0].createdAt;
replacePayload.workspace.suppliers[0].companyName = "Renamed By Import";
replacePayload.workspace.suppliers.push({
  ...replacePayload.workspace.suppliers[0],
  id: "imported-supplier-1",
  companyName: "Imported Minerals Ltd",
});
const replaced = importWorkspace(replacePayload, "replace");
const afterReplace = readSupplierWorkspace();
check(afterReplace.suppliers.some((supplier) => supplier.companyName === "Renamed By Import"), "replace applies imported changes");
check(afterReplace.suppliers.some((supplier) => supplier.id === "imported-supplier-1"), "replace adds imported records");
const firstAfter = afterReplace.suppliers.find((supplier) => supplier.id === firstId);
check(firstAfter?.createdAt === firstCreated, "replace preserves record ids and timestamps");
check(replaced.version === 3, "replace result is normalized to version 3");

console.log("\n=== import: merge strategy (additive, current wins) ===");
const beforeMerge = readSupplierWorkspace();
const mergePayload = JSON.parse(JSON.stringify(envelope)) as typeof envelope;
const conflictId = mergePayload.workspace.suppliers[0].id;
mergePayload.workspace.suppliers[0].companyName = "Merged Name That Must Lose";
mergePayload.workspace.suppliers.push({
  ...mergePayload.workspace.suppliers[0],
  id: "merged-supplier-2",
  companyName: "Second Imported Co",
});
const conflictSupplier = beforeMerge.suppliers.find((supplier) => supplier.id === conflictId);
const activityCountsBefore = new Map(Object.entries(beforeMerge.activities).map(([key, list]) => [key, list.length]));
const incomingOnlyActivity = {
  id: "imported-activity-1",
  supplierId: conflictId,
  type: "SUPPLIER_CREATED" as const,
  title: "Arrived via import",
  details: "Added by merge",
  createdAt: "2026-10-05T00:00:00.000Z",
};
mergePayload.workspace.activities = {
  ...(mergePayload.workspace.activities ?? {}),
  [conflictId]: [...((mergePayload.workspace.activities ?? {})[conflictId] ?? []), incomingOnlyActivity],
};
importWorkspace(mergePayload, "merge");
const afterMerge = readSupplierWorkspace();
check(afterMerge.suppliers.some((supplier) => supplier.id === "merged-supplier-2"), "merge adds new records");
const conflictAfter = afterMerge.suppliers.find((supplier) => supplier.id === conflictId);
check(conflictAfter?.companyName === conflictSupplier?.companyName, "merge keeps current record on id conflict (current wins)");
check(
  (afterMerge.activities[conflictId]?.length ?? 0) === (activityCountsBefore.get(conflictId) ?? 0) + 1,
  "merge appends incoming activities without dropping any current ones",
);
check(
  afterMerge.activities[conflictId]?.some((activity) => activity.id === "imported-activity-1") === true,
  "merge keeps incoming activities",
);
check(afterMerge.suppliers.length === beforeMerge.suppliers.length + 1, "merge adds exactly the new supplier");

console.log("\n=== authorization ===");
storage.removeItem("minerallink:dev-session");
let threw = false;
try {
  exportWorkspace();
} catch {
  threw = true;
}
check(threw, "export without a session throws");
signIn("dev-viewer");
const viewerExport = exportWorkspace();
check(viewerExport.workspace.version === 3, "viewer can export (settings.read)");
threw = false;
try {
  importWorkspace(envelope, "replace");
} catch (error) {
  threw = error instanceof PermissionDeniedError && error.permission === "user.manage";
}
check(threw, "viewer import throws PermissionDeniedError(user.manage)");
signIn("dev-admin");
threw = false;
try {
  importWorkspace({ broken: true }, "replace");
} catch (error) {
  threw = error instanceof WorkspaceImportError && error.errors.length > 0;
}
check(threw, "admin import of malformed payload throws WorkspaceImportError with details");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
