"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { AccessDenied } from "@/components/auth/access-denied";
import { can } from "@/lib/auth/permissions";
import { permissionForRoute } from "@/lib/auth/route-permissions";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!isLogin && !loading && !user) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }, [isLogin, loading, pathname, router, user]);

  if (isLogin) return children;
  if (loading || !user) return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><p className="text-sm text-slate-600">Checking development session…</p></main>;

  const requiredPermission = permissionForRoute(pathname);
  if (requiredPermission && !can(user, requiredPermission)) {
    return <DashboardShell><AccessDenied permission={requiredPermission} /></DashboardShell>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
