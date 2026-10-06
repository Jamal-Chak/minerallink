// Phase 7 — controlled persistence error model (safe for browser + server).
//
// Raw Prisma / SQL errors must never reach the browser. Server routes map
// caught errors through `toPersistenceError` / `persistenceHttpStatus` and
// return only `{ error: { code, message } }` with safe operational context.

export const PERSISTENCE_ERROR_CODES = [
  "NOT_FOUND",
  "VALIDATION",
  "PERMISSION_DENIED",
  "CONFLICT",
  "DATABASE_UNAVAILABLE",
  "UNKNOWN",
] as const;

export type PersistenceErrorCode = (typeof PERSISTENCE_ERROR_CODES)[number];

export class PersistenceError extends Error {
  readonly code: PersistenceErrorCode;
  readonly details?: string[];

  constructor(code: PersistenceErrorCode, message: string, details?: string[]) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
    if (details) this.details = details;
  }
}

export function persistenceHttpStatus(code: PersistenceErrorCode): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 400;
    case "PERMISSION_DENIED":
      return 403;
    case "CONFLICT":
      return 409;
    case "DATABASE_UNAVAILABLE":
      return 503;
    case "UNKNOWN":
    default:
      return 500;
  }
}

/** Safe public message per code — never includes SQL, hosts, or credentials. */
export function safePersistenceMessage(code: PersistenceErrorCode): string {
  switch (code) {
    case "NOT_FOUND":
      return "The requested record was not found.";
    case "VALIDATION":
      return "The request was invalid.";
    case "PERMISSION_DENIED":
      return "You do not have permission to perform this action.";
    case "CONFLICT":
      return "The record changed since it was read. Refresh and retry.";
    case "DATABASE_UNAVAILABLE":
      return "Server persistence is temporarily unavailable. Browser data is unaffected.";
    case "UNKNOWN":
    default:
      return "An unexpected persistence error occurred.";
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Map an unknown caught error to a PersistenceError without leaking internals.
 * - PermissionDeniedError -> PERMISSION_DENIED
 * - Zod-style validation errors (name === "ZodError") -> VALIDATION
 * - Prisma known request errors: P2002 -> CONFLICT, P2025 -> NOT_FOUND,
 *   connection codes -> DATABASE_UNAVAILABLE.
 * - Everything else -> UNKNOWN (message redacted).
 */
export function toPersistenceError(error: unknown): PersistenceError {
  if (error instanceof PersistenceError) return error;
  if (error instanceof Error && error.name === "PermissionDeniedError") {
    return new PersistenceError("PERMISSION_DENIED", safePersistenceMessage("PERMISSION_DENIED"));
  }
  if (error instanceof Error && error.name === "ZodError") {
    return new PersistenceError("VALIDATION", safePersistenceMessage("VALIDATION"), [redact(messageOf(error))]);
  }
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string") {
    if (code === "P2002") return new PersistenceError("CONFLICT", safePersistenceMessage("CONFLICT"));
    if (code === "P2025") return new PersistenceError("NOT_FOUND", safePersistenceMessage("NOT_FOUND"));
    if (code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "ENOTFOUND" || code.startsWith("P10")) {
      return new PersistenceError("DATABASE_UNAVAILABLE", safePersistenceMessage("DATABASE_UNAVAILABLE"));
    }
  }
  const text = messageOf(error).toLowerCase();
  if (text.includes("timed out") || text.includes("can't reach") || text.includes("connection")) {
    return new PersistenceError("DATABASE_UNAVAILABLE", safePersistenceMessage("DATABASE_UNAVAILABLE"));
  }
  return new PersistenceError("UNKNOWN", safePersistenceMessage("UNKNOWN"));
}

/** Redact anything that looks like a URL, host, or credential fragment. */
function redact(value: string): string {
  return value
    .replace(/postgres(ql)?:\/\/\S+/gi, "postgres://[redacted]")
    .replace(/host=[^\s;]+/gi, "host=[redacted]")
    .slice(0, 500);
}

/** Log only safe operational context on the server (never the raw error). */
export function logPersistenceError(operation: string, error: PersistenceError): void {
  console.error(`[persistence:${operation}] ${error.code}`);
}
