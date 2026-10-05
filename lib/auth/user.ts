export const USER_ROLES = [
  "ADMIN",
  "SOURCING_MANAGER",
  "SOURCING_AGENT",
  "VERIFICATION_ANALYST",
  "COMMERCIAL_MANAGER",
  "VIEWER",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "INVITED", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface ApplicationUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
