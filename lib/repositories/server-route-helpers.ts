// Phase 7 — server route helpers (server-only).
// Every mutation route: resolve session -> require Phase 5 permission ->
// validate with Zod -> run server repository -> audit -> controlled response.
// Raw Prisma errors never reach the browser.
import { NextResponse } from "next/server";
import { DEVELOPMENT_SESSION_COOKIE } from "@/lib/auth/constants";
import { requireServerPermission } from "@/lib/auth/server-authorization";
import type { Permission } from "@/lib/auth/permissions";
import {
  logPersistenceError,
  persistenceHttpStatus,
  toPersistenceError,
} from "@/lib/repositories/persistence-errors";
import type { ServerActor } from "@/lib/repositories/prisma-workspace-repository";

export function serverActorFromCookie(cookieValue: string | undefined, permission: Permission): ServerActor {
  const user = requireServerPermission(cookieValue ?? null, permission);
  return { id: user.id, name: user.name };
}

export function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DEVELOPMENT_SESSION_COOKIE}=`));
  return match?.slice(DEVELOPMENT_SESSION_COOKIE.length + 1) || undefined;
}

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function persistenceFailure(operation: string, error: unknown): NextResponse {
  const mapped = toPersistenceError(error);
  logPersistenceError(operation, mapped);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: mapped.code,
        message: mapped.message,
        details: mapped.details ?? [],
      },
    },
    { status: persistenceHttpStatus(mapped.code) },
  );
}
