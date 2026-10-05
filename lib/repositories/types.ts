import type { SupplierWorkspace } from "@/lib/data/workspace-model";

/**
 * Persistence backends currently available for the workspace aggregate.
 * "server-api" is reserved for the future server-side adapter.
 */
export type WorkspaceBackend = "browser-localstorage" | "server-api";

/**
 * Persistence-agnostic contract over the SupplierWorkspace aggregate.
 *
 * All supplier / CRM / deal mutations in lib/data/supplier-workspace.ts go
 * through this interface, so swapping the backing store (localStorage today,
 * a server API tomorrow) requires only a new adapter — no mutation or
 * component changes.
 */
export interface WorkspaceRepository {
  /** Identifies the active backend for diagnostics and readiness reporting. */
  readonly backend: WorkspaceBackend;
  /** Load the current workspace. Must be safe to call outside the browser (returns the seeded workspace). */
  read(): SupplierWorkspace;
  /** Persist the full workspace atomically and notify subscribers. */
  write(workspace: SupplierWorkspace): void;
  /** Subscribe to change notifications (same tab and cross tab). Returns an unsubscribe function. */
  subscribe(onChange: () => void): () => void;
}
