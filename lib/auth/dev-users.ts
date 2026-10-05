import type { ApplicationUser } from "@/lib/auth/user";

export const DEVELOPMENT_USERS: readonly ApplicationUser[] = [
  { id: "dev-admin", name: "Admin User", email: "admin@minerallink.example.invalid", role: "ADMIN", status: "ACTIVE", createdAt: "2026-10-05T00:00:00.000Z", updatedAt: "2026-10-05T00:00:00.000Z" },
  { id: "dev-sourcing-manager", name: "Sourcing Manager", email: "sourcing.manager@minerallink.example.invalid", role: "SOURCING_MANAGER", status: "ACTIVE", createdAt: "2026-10-05T00:00:00.000Z", updatedAt: "2026-10-05T00:00:00.000Z" },
  { id: "dev-sourcing-agent", name: "Sourcing Agent", email: "sourcing.agent@minerallink.example.invalid", role: "SOURCING_AGENT", status: "ACTIVE", createdAt: "2026-10-05T00:00:00.000Z", updatedAt: "2026-10-05T00:00:00.000Z" },
  { id: "dev-verification-analyst", name: "Verification Analyst", email: "verification.analyst@minerallink.example.invalid", role: "VERIFICATION_ANALYST", status: "ACTIVE", createdAt: "2026-10-05T00:00:00.000Z", updatedAt: "2026-10-05T00:00:00.000Z" },
  { id: "dev-commercial-manager", name: "Commercial Manager", email: "commercial.manager@minerallink.example.invalid", role: "COMMERCIAL_MANAGER", status: "ACTIVE", createdAt: "2026-10-05T00:00:00.000Z", updatedAt: "2026-10-05T00:00:00.000Z" },
  { id: "dev-viewer", name: "Viewer", email: "viewer@minerallink.example.invalid", role: "VIEWER", status: "ACTIVE", createdAt: "2026-10-05T00:00:00.000Z", updatedAt: "2026-10-05T00:00:00.000Z" },
];

export function getDefaultDevelopmentUser(userId: string): ApplicationUser | undefined {
  return DEVELOPMENT_USERS.find((user) => user.id === userId);
}
