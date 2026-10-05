"use client";

import type { ReactNode } from "react";

import { AccessDenied } from "@/components/auth/access-denied";
import { useAuth } from "@/components/auth/auth-provider";
import { can, type Permission } from "@/lib/auth/permissions";

export function PermissionGate({ permission, children, fallback }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  if (can(user, permission)) return children;
  return fallback ?? <AccessDenied permission={permission} />;
}
