"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  Factory,
  ListTodo,
  MapPinned,
  MessageSquareText,
  Settings,
  Truck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { permissionForRoute } from "@/lib/auth/route-permissions";

const navItems = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/suppliers", label: "Suppliers", icon: Users },
  { href: "/outreach", label: "Outreach", icon: MessageSquareText },
  { href: "/follow-ups", label: "Follow-ups", icon: ListTodo },
  { href: "/requirements", label: "Buyer Requirements", icon: ClipboardCheck },
  { href: "/matching", label: "Matching", icon: Factory },
  { href: "/deals", label: "Deals", icon: BriefcaseBusiness },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/shipments", label: "Shipments", icon: Truck },
  { href: "/reports", label: "Reports", icon: MapPinned },
];

const secondaryItems = [{ href: "/settings", label: "Settings", icon: Settings }];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
          ML
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight">MineralLink</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Mineral Supplier Intelligence
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-3 py-5">
        <div className="space-y-1">
          {navItems.filter(({ href }) => {
            const permission = permissionForRoute(href);
            return !permission || can(user, permission);
          }).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-slate-800 pt-4">
          {secondaryItems.filter(({ href }) => {
            const permission = permissionForRoute(href);
            return !permission || can(user, permission);
          }).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
