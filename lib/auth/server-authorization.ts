import { assertCan, type Permission } from "@/lib/auth/permissions";
import { getSessionUserId } from "@/lib/auth/dev-session-api";
import { getDefaultDevelopmentUser } from "@/lib/auth/dev-users";
import type { ApplicationUser } from "@/lib/auth/user";

/**
 * Server-side authorization helpers for future workspace write routes.
 *
 * These reuse the existing development-session cookie and the Phase 5
 * role/permission matrix — they do NOT introduce a second auth system.
 * Typical use inside a future route handler:
 *
 *   import { cookies } from "next/headers";
 *   import { DEVELOPMENT_SESSION_COOKIE } from "@/lib/auth/constants";
 *   import { requireServerPermission } from "@/lib/auth/server-authorization";
 *
 *   const store = await cookies();
 *   const user = requireServerPermission(
 *     store.get(DEVELOPMENT_SESSION_COOKIE)?.value,
 *     "deal.create",
 *   );
 *
 * Rules preserved from the client-side implementation:
 * - only resolves sessions when NODE_ENV === "development";
 * - only ACTIVE users pass (assertCan throws otherwise);
 * - a missing session throws the session-required error, a wrong role throws
 *   PermissionDeniedError.
 */
export function resolveServerSession(cookieValue?: string | null): ApplicationUser | null {
  const userId = getSessionUserId(cookieValue ?? undefined);
  if (!userId) return null;
  return getDefaultDevelopmentUser(userId) ?? null;
}

export function requireServerSession(cookieValue?: string | null): ApplicationUser {
  const user = resolveServerSession(cookieValue);
  if (!user) {
    throw new Error("An active development session is required for this action.");
  }
  return user;
}

export function requireServerPermission(
  cookieValue: string | null | undefined,
  permission: Permission,
): ApplicationUser {
  const user = resolveServerSession(cookieValue);
  assertCan(user, permission);
  return user;
}
