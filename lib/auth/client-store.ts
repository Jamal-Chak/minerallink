import { assertCan } from "@/lib/auth/permissions";
import { DEVELOPMENT_USERS } from "@/lib/auth/dev-users";
import { DEVELOPMENT_SESSION_STORAGE_KEY, DEVELOPMENT_USERS_STORAGE_KEY } from "@/lib/auth/constants";
import { USER_ROLES, USER_STATUSES, type ApplicationUser, type UserRole, type UserStatus } from "@/lib/auth/user";

export function readDevelopmentUsers(): ApplicationUser[] {
  if (typeof window === "undefined") return [...DEVELOPMENT_USERS];
  try {
    const serialized = window.localStorage.getItem(DEVELOPMENT_USERS_STORAGE_KEY);
    if (!serialized) return [...DEVELOPMENT_USERS];
    const stored = JSON.parse(serialized) as Partial<ApplicationUser>[];
    return DEVELOPMENT_USERS.map((defaultUser) => {
      const override = stored.find((user) => user.id === defaultUser.id);
      if (!override) return defaultUser;
      const role = USER_ROLES.includes(override.role as UserRole) ? override.role as UserRole : defaultUser.role;
      const status = USER_STATUSES.includes(override.status as UserStatus) ? override.status as UserStatus : defaultUser.status;
      return { ...defaultUser, role, status, updatedAt: override.updatedAt ?? defaultUser.updatedAt };
    });
  } catch {
    return [...DEVELOPMENT_USERS];
  }
}

export function readDevelopmentSessionUser(): ApplicationUser | null {
  if (typeof window === "undefined") return null;
  const userId = window.localStorage.getItem(DEVELOPMENT_SESSION_STORAGE_KEY);
  if (!userId) return null;
  const user = readDevelopmentUsers().find((item) => item.id === userId);
  return user?.status === "ACTIVE" ? user : null;
}

export function storeDevelopmentSession(userId: string): void {
  window.localStorage.setItem(DEVELOPMENT_SESSION_STORAGE_KEY, userId);
}

export function clearDevelopmentSession(): void {
  window.localStorage.removeItem(DEVELOPMENT_SESSION_STORAGE_KEY);
}

export function updateDevelopmentUser(
  actor: ApplicationUser | null,
  userId: string,
  updates: { role?: UserRole; status?: UserStatus },
): ApplicationUser[] {
  assertCan(actor, "user.manage");
  const users = readDevelopmentUsers();
  if (!users.some((user) => user.id === userId)) throw new Error("Development user was not found.");
  const updatedAt = new Date().toISOString();
  const next = users.map((user) => user.id === userId ? { ...user, ...updates, updatedAt } : user);
  window.localStorage.setItem(DEVELOPMENT_USERS_STORAGE_KEY, JSON.stringify(next));
  if (actor.id === userId && updates.status && updates.status !== "ACTIVE") {
    clearDevelopmentSession();
    void fetch("/api/auth/session", { method: "DELETE" });
  }
  window.dispatchEvent(new CustomEvent("minerallink:dev-users-change"));
  return next;
}
