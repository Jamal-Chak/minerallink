// Phase 6 — repository contract tests for the BrowserWorkspaceRepository adapter.
// Run: npx tsx scripts/test-workspace-repository.ts
import { BrowserWorkspaceRepository } from "../lib/repositories/browser-workspace-repository";
import {
  getWorkspaceRepository,
  setWorkspaceRepository,
  type WorkspaceRepository,
} from "../lib/repositories";
import { readSupplierWorkspace, subscribeToSupplierWorkspace } from "../lib/data/supplier-workspace";
import { WORKSPACE_STORAGE_KEYS, type SupplierWorkspace } from "../lib/data/workspace-model";

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
  clear(): void {
    this.map.clear();
  }
}

type StubListener = (event: { type: string }) => void;
type BrowserWindowStub = {
  localStorage: FakeStorage;
  addEventListener(type: string, listener: StubListener): void;
  removeEventListener(type: string, listener: StubListener): void;
  dispatchEvent(event: { type: string }): boolean;
};

const globalScope = globalThis as unknown as { window?: BrowserWindowStub; CustomEvent?: unknown };
const listeners = new Map<string, Set<StubListener>>();

function installWindow(): FakeStorage {
  const storage = new FakeStorage();
  globalScope.window = {
    localStorage: storage,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event) {
      for (const listener of [...(listeners.get(event.type) ?? [])]) listener(event);
      return true;
    },
  };
  return storage;
}

if (typeof globalScope.CustomEvent === "undefined") {
  globalScope.CustomEvent = class CustomEventPolyfill {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
}

const storage = installWindow();
const repo = new BrowserWorkspaceRepository();

console.log("\n=== BrowserWorkspaceRepository contract ===");
check(repo.backend === "browser-localstorage", "backend identifier is browser-localstorage");

const fresh = repo.read();
check(fresh.version === 3, "fresh read returns version 3");
check(fresh.suppliers.length > 0, "fresh read seeds suppliers");
check(storage.getItem(WORKSPACE_STORAGE_KEYS.current) !== null, "fresh read persists under the v3 key");

console.log("\n=== read stability (converges after one backfill pass) ===");
let events = 0;
const unsubscribe = repo.subscribe(() => {
  events += 1;
});
const storedBefore = storage.getItem(WORKSPACE_STORAGE_KEYS.current);
repo.read();
const storedAfterBackfill = storage.getItem(WORKSPACE_STORAGE_KEYS.current);
const backfillEvents = events;
check(backfillEvents <= 1, "at most one backfill event on the first normalize pass (original behaviour)");
const converged = repo.read();
check(storage.getItem(WORKSPACE_STORAGE_KEYS.current) === storedAfterBackfill, "storage converges (no repeated rewrites)");
check(events === backfillEvents, "no further events once converged");
check(JSON.stringify(converged) === storedAfterBackfill, "read is deterministic once converged");
check(storedBefore !== null, "precondition: storage was seeded before convergence");

console.log("\n=== write / subscribe ===");
const eventsAfterConverge = events;
const modified = JSON.parse(JSON.stringify(converged)) as SupplierWorkspace;
modified.suppliers[0].companyName = "Round Trip Minerals";
repo.write(modified);
check(events === eventsAfterConverge + 1, "write dispatches exactly one change event");
const reloaded = repo.read();
check(reloaded.suppliers[0].companyName === "Round Trip Minerals", "write/read roundtrip preserves data");
check(events === eventsAfterConverge + 1, "read-after-write adds no extra event");

globalScope.window!.dispatchEvent({ type: "storage" });
check(events === eventsAfterConverge + 2, "cross-tab storage events reach subscribers");
unsubscribe();
repo.write(modified);
check(events === eventsAfterConverge + 2, "unsubscribe stops notifications");
console.log("\n=== public API delegates to active repository ===");
const memoryValue = JSON.parse(JSON.stringify(reloaded)) as SupplierWorkspace;
class MemoryRepository implements WorkspaceRepository {
  readonly backend = "server-api" as const;
  constructor(public value: SupplierWorkspace) {}
  read(): SupplierWorkspace {
    return this.value;
  }
  write(workspace: SupplierWorkspace): void {
    this.value = workspace;
  }
  subscribe(): () => void {
    return () => undefined;
  }
}
const memoryRepo = new MemoryRepository(memoryValue);
setWorkspaceRepository(memoryRepo);
check(getWorkspaceRepository() === memoryRepo, "registry returns swapped repository");
check(getWorkspaceRepository().backend === "server-api", "swapped backend reported");
check(readSupplierWorkspace() === memoryValue, "readSupplierWorkspace delegates to active repository");
setWorkspaceRepository(repo);
check(getWorkspaceRepository() === repo, "registry restores browser repository");

console.log("\n=== legacy key migration (v2 → v3) ===");
const legacy = JSON.parse(JSON.stringify(repo.read())) as Omit<SupplierWorkspace, "version"> & { version: number };
legacy.version = 2;
(legacy as Record<string, unknown>).customTopLevel = "preserved";
const customSupplier = { ...repo.read().suppliers[0], id: "custom-supplier-1", companyName: "Legacy Imported Co", weirdField: "kept" };
legacy.suppliers = [...legacy.suppliers, customSupplier];
delete (legacy as Partial<SupplierWorkspace>).shipments;
storage.clear();
storage.setItem(WORKSPACE_STORAGE_KEYS.previous, JSON.stringify(legacy));
const migrated = repo.read();
check(migrated.version === 3, "v2 payload migrates to version 3");
check(migrated.suppliers.some((supplier) => supplier.id === "custom-supplier-1"), "legacy supplier preserved");
check((migrated as unknown as Record<string, unknown>).customTopLevel === "preserved", "unknown top-level field preserved");
const migratedCustom = migrated.suppliers.find((supplier) => supplier.id === "custom-supplier-1");
check((migratedCustom as unknown as Record<string, unknown>).weirdField === "kept", "unknown supplier field preserved");
check(storage.getItem(WORKSPACE_STORAGE_KEYS.current) !== null, "migrated payload rewritten under v3 key");
check(Array.isArray(migrated.shipments), "missing collection backfilled on migrate");

console.log("\n=== legacy v1 key + corrupted payload ===");
storage.clear();
storage.setItem(WORKSPACE_STORAGE_KEYS.legacy, JSON.stringify({ version: 1, suppliers: [] }));
const fromV1Empty = repo.read();
check(fromV1Empty.version === 3 && fromV1Empty.suppliers.length === 0, "v1 payload with empty suppliers stays empty (original ?? semantics)");
storage.clear();
storage.setItem(WORKSPACE_STORAGE_KEYS.legacy, JSON.stringify({ version: 1 }));
const fromV1 = repo.read();
check(fromV1.version === 3 && fromV1.suppliers.length > 0, "v1 payload without suppliers falls back to seed");
storage.clear();
storage.setItem(WORKSPACE_STORAGE_KEYS.current, "{not-json");
const recovered = repo.read();
check(recovered.version === 3 && recovered.suppliers.length > 0, "corrupted payload recovers to seed without throwing");

console.log("\n=== SSR guard ===");
const savedWindow = globalScope.window;
delete globalScope.window;
const ssr = new BrowserWorkspaceRepository().read();
check(ssr.version === 3 && ssr.suppliers.length > 0, "read outside the browser returns seeded workspace");
globalScope.window = savedWindow;

console.log("\n=== subscribe via public API ===");
let apiEvents = 0;
const unsubscribeApi = subscribeToSupplierWorkspace(() => {
  apiEvents += 1;
});
repo.write(repo.read());
check(apiEvents >= 1, "subscribeToSupplierWorkspace notifies on write");
unsubscribeApi();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
