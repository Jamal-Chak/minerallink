// Phase 7 — server workspace API: status endpoint (read-only diagnostics).
// GET /api/workspace/status reports the persistence mode without exposing
// any credentials or connection details.
import { NextResponse } from "next/server";
import { BROWSER_FALLBACK_AVAILABLE, getPersistenceMode } from "@/lib/repositories/persistence-mode";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      data: {
        mode: getPersistenceMode(),
        serverDefault: getPersistenceMode() === "server",
        browserFallbackAvailable: BROWSER_FALLBACK_AVAILABLE,
        databaseActivated: false,
        migrationApplied: false,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
