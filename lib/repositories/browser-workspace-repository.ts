import {
  WORKSPACE_CHANGE_EVENT,
  WORKSPACE_STORAGE_KEYS,
  initialWorkspace,
  normalizeStoredWorkspace,
  type SupplierWorkspace,
} from "@/lib/data/workspace-model";
import type { WorkspaceRepository } from "./types";

/**
 * WorkspaceRepository adapter backed by window.localStorage.
 *
 * Preserves the exact behaviour of the original inline implementation:
 * - reads v3 first, then falls back to the v2 and v1 legacy keys;
 * - normalizes (migrates) older payloads and rewrites them under the v3 key,
 *   dispatching a change event only when the stored value actually changed;
 * - falls back to the seeded workspace when storage is empty or corrupted;
 * - read()/write()/subscribe() are no-ops (seeded value) outside the browser.
 */
export class BrowserWorkspaceRepository implements WorkspaceRepository {
  readonly backend = "browser-localstorage" as const;

  read(): SupplierWorkspace {
    if (typeof window === "undefined") {
      return initialWorkspace();
    }

    const saved = window.localStorage.getItem(WORKSPACE_STORAGE_KEYS.current)
      ?? window.localStorage.getItem(WORKSPACE_STORAGE_KEYS.previous)
      ?? window.localStorage.getItem(WORKSPACE_STORAGE_KEYS.legacy);
    if (!saved) {
      const initial = initialWorkspace();
      window.localStorage.setItem(WORKSPACE_STORAGE_KEYS.current, JSON.stringify(initial));
      return initial;
    }

    try {
      const normalized = normalizeStoredWorkspace(JSON.parse(saved) as Partial<SupplierWorkspace>);
      const serialized = JSON.stringify(normalized);
      if (window.localStorage.getItem(WORKSPACE_STORAGE_KEYS.current) !== serialized) {
        window.localStorage.setItem(WORKSPACE_STORAGE_KEYS.current, serialized);
        window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGE_EVENT));
      }
      return normalized;
    } catch {
      const initial = initialWorkspace();
      window.localStorage.setItem(WORKSPACE_STORAGE_KEYS.current, JSON.stringify(initial));
      return initial;
    }
  }

  write(workspace: SupplierWorkspace): void {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEYS.current, JSON.stringify(workspace));
    window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGE_EVENT));
  }

  subscribe(onChange: () => void): () => void {
    window.addEventListener("storage", onChange);
    window.addEventListener(WORKSPACE_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(WORKSPACE_CHANGE_EVENT, onChange);
    };
  }
}
