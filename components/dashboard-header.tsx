"use client";

import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/auth/account-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";

export function DashboardHeader() {
  const { user } = useAuth();
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 lg:hidden">
            ML
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Operations</div>
            <div className="text-sm font-medium text-slate-700">Supplier intelligence dashboard</div>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <label className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 shadow-sm">
            <Search className="h-4 w-4" />
            <input
              aria-label="Search suppliers"
              className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search suppliers, products, or locations"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900"><span className="sm:hidden">DEV AUTH</span><span className="hidden sm:inline">Development authentication</span></span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          {can(user, "supplier.create") && <Button size="sm" className="hidden sm:inline-flex" nativeButton={false} render={<Link href="/suppliers/new" />}>
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
