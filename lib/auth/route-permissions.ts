import type { Permission } from "@/lib/auth/permissions";

const routePermissions: Array<{ path: string; permission: Permission }> = [
  { path: "/suppliers", permission: "supplier.read" },
  { path: "/requirements", permission: "requirement.read" },
  { path: "/matching", permission: "match.read" },
  { path: "/outreach", permission: "outreach.read" },
  { path: "/follow-ups", permission: "followup.read" },
  { path: "/deals", permission: "deal.read" },
  { path: "/documents", permission: "supplier.evidence.read" },
  { path: "/shipments", permission: "shipment.read" },
  { path: "/reports", permission: "report.read" },
  { path: "/settings", permission: "settings.read" },
];

export function permissionForRoute(pathname: string): Permission | undefined {
  return routePermissions.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))?.permission;
}
