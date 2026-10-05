import type { ReactNode } from "react";

import { ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  trend?: "up" | "neutral";
  icon: ReactNode;
}

export function MetricCard({ label, value, change, trend = "up", icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900">{value}</div>
          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
            <span className={trend === "up" ? "text-emerald-600" : "text-slate-500"}>{change}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
