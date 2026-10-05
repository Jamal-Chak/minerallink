import { assertCan, type Permission } from "@/lib/auth/permissions";
import { readDevelopmentSessionUser } from "@/lib/auth/client-store";
import type { ApplicationUser } from "@/lib/auth/user";

export function requireClientPermission(permission: Permission): ApplicationUser {
  if (typeof window === "undefined") throw new Error("Development session is unavailable outside the browser.");
  const user = readDevelopmentSessionUser();
  assertCan(user, permission);
  return user;
}

export function currentClientActor(): Pick<ApplicationUser, "id" | "name"> | undefined {
  const user = readDevelopmentSessionUser();
  return user ? { id: user.id, name: user.name } : undefined;
}
