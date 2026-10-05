import type { ApplicationUser, UserRole } from "@/lib/auth/user";

export const PERMISSIONS = [
  "supplier.read",
  "supplier.create",
  "supplier.update",
  "supplier.evidence.read",
  "supplier.evidence.manage",
  "supplier.verify",
  "supplier.pipeline.manage",
  "outreach.read",
  "outreach.log",
  "followup.read",
  "followup.manage",
  "information.manage",
  "requirement.read",
  "match.read",
  "match.audit",
  "deal.read",
  "deal.create",
  "deal.stage.manage",
  "deal.introduction.manage",
  "commercial.read",
  "commercial.edit",
  "shipment.read",
  "shipment.manage",
  "payment.manage",
  "payment.read",
  "commission.read",
  "commission.edit",
  "report.read",
  "settings.read",
  "user.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  SOURCING_MANAGER: [
    "supplier.read", "supplier.create", "supplier.update", "supplier.evidence.read", "supplier.evidence.manage", "supplier.pipeline.manage",
    "outreach.read", "outreach.log", "followup.read", "followup.manage", "information.manage", "requirement.read", "match.read", "match.audit",
    "deal.read", "deal.create", "deal.stage.manage", "shipment.read", "report.read", "settings.read",
  ],
  SOURCING_AGENT: [
    "supplier.read", "supplier.create", "supplier.update", "supplier.evidence.read", "supplier.pipeline.manage", "outreach.read", "outreach.log",
    "followup.read", "followup.manage", "information.manage", "requirement.read", "match.read", "match.audit", "deal.read", "settings.read",
  ],
  VERIFICATION_ANALYST: [
    "supplier.read", "supplier.evidence.read", "supplier.evidence.manage", "supplier.verify", "requirement.read", "match.read", "settings.read",
  ],
  COMMERCIAL_MANAGER: [
    "supplier.read", "supplier.evidence.read", "requirement.read", "match.read", "deal.read", "deal.create", "deal.stage.manage",
    "deal.introduction.manage", "commercial.read", "commercial.edit", "shipment.read", "shipment.manage", "payment.read", "payment.manage", "commission.read",
    "commission.edit", "report.read", "settings.read",
  ],
  VIEWER: [
    "supplier.read", "supplier.evidence.read", "outreach.read", "followup.read", "requirement.read", "match.read", "deal.read",
    "commercial.read", "shipment.read", "payment.read", "commission.read", "report.read", "settings.read",
  ],
};

const permissionMessages: Record<Permission, string> = {
  "supplier.read": "You do not have permission to view suppliers.",
  "supplier.create": "You do not have permission to create suppliers.",
  "supplier.update": "You do not have permission to edit supplier products.",
  "supplier.evidence.read": "You do not have permission to view supplier evidence.",
  "supplier.evidence.manage": "You do not have permission to manage supplier evidence.",
  "supplier.verify": "You do not have permission to verify suppliers.",
  "supplier.pipeline.manage": "You do not have permission to change supplier pipeline status.",
  "outreach.read": "You do not have permission to view supplier outreach.",
  "outreach.log": "You do not have permission to log supplier communications.",
  "followup.read": "You do not have permission to view follow-ups.",
  "followup.manage": "You do not have permission to manage follow-ups.",
  "information.manage": "You do not have permission to manage supplier information requests.",
  "requirement.read": "You do not have permission to view buyer requirements.",
  "match.read": "You do not have permission to view buyer matches.",
  "match.audit": "You do not have permission to record match audit events.",
  "deal.read": "You do not have permission to view deals.",
  "deal.create": "You do not have permission to create deals.",
  "deal.stage.manage": "You do not have permission to change deal stages.",
  "deal.introduction.manage": "You do not have permission to record buyer introductions.",
  "commercial.read": "You do not have permission to view commercial terms.",
  "commercial.edit": "You do not have permission to edit commercial terms or negotiations.",
  "shipment.read": "You do not have permission to view shipment records.",
  "shipment.manage": "You do not have permission to manage shipment records.",
  "payment.manage": "You do not have permission to manage payment milestones.",
  "payment.read": "You do not have permission to view payment milestones.",
  "commission.read": "You do not have permission to view commission information.",
  "commission.edit": "You do not have permission to edit commission terms.",
  "report.read": "You do not have permission to view reports.",
  "settings.read": "You do not have permission to view settings.",
  "user.manage": "You do not have permission to manage users.",
};

export class PermissionDeniedError extends Error {
  constructor(readonly permission: Permission) {
    super(permissionMessages[permission]);
    this.name = "PermissionDeniedError";
  }
}

export function can(user: ApplicationUser | null | undefined, permission: Permission): boolean {
  return Boolean(user && user.status === "ACTIVE" && rolePermissions[user.role].includes(permission));
}

export function assertCan(user: ApplicationUser | null | undefined, permission: Permission): asserts user is ApplicationUser {
  if (!user || user.status !== "ACTIVE") {
    throw new Error("An active development session is required for this action.");
  }
  if (!rolePermissions[user.role].includes(permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export function permissionMessage(permission: Permission): string {
  return permissionMessages[permission];
}
