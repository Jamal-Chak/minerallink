// Phase 7 — explicit persistence mode flag.
//
// Default remains "browser". Server persistence is opt-in, inspectable,
// reversible, and never carries credentials.
//
// Switch modes with (server runtime only):
//   MINERALLINK_PERSISTENCE_MODE=server
// Any other value (including unset) resolves to "browser".
//
// The browser repository stays registered as the active WorkspaceRepository.
// The async server client (`ServerWorkspaceClient`) is used explicitly by
// future UI — nothing swaps globally until parity is proven.

export const PERSISTENCE_MODES = ["browser", "server"] as const;
export type PersistenceMode = (typeof PERSISTENCE_MODES)[number];

export const DEFAULT_PERSISTENCE_MODE: PersistenceMode = "browser";

/** Browser fallback is always retained in Phase 7 for rollback. */
export const BROWSER_FALLBACK_AVAILABLE = true as const;

export function getPersistenceMode(env?: NodeJS.ProcessEnv): PersistenceMode {
  const raw = (env ?? process.env).MINERALLINK_PERSISTENCE_MODE;
  return raw === "server" ? "server" : "browser";
}

export function isServerPersistenceDefault(env?: NodeJS.ProcessEnv): boolean {
  return getPersistenceMode(env) === "server";
}

export function describePersistenceMode(env?: NodeJS.ProcessEnv): {
  mode: PersistenceMode;
  serverDefault: boolean;
  browserFallbackAvailable: boolean;
} {
  const mode = getPersistenceMode(env);
  return { mode, serverDefault: mode === "server", browserFallbackAvailable: BROWSER_FALLBACK_AVAILABLE };
}
