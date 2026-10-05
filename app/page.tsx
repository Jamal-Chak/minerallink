import { ArrowUpRight, Building2, Factory, ShieldCheck, Warehouse } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { SourcingOverview } from "@/components/supplier-crm/sourcing-overview";
import {
  buyerRequirements,
  pipelineSummary,
  recentActivity,
  supplierProfiles,
  supplyOverview,
} from "@/lib/data/demo-data";

const statusOrder = [
  "NEW",
  "CONTACTED",
  "RESPONDED",
  "DOCUMENTS_REQUESTED",
  "UNDER_VERIFICATION",
  "QUALIFIED",
  "REJECTED",
] as const;

export default function HomePage() {
  const metrics = [
    { label: "Total Suppliers", value: supplierProfiles.length.toString(), change: "+12.4%", icon: <Building2 className="h-4 w-4" /> },
    { label: "Verified Suppliers", value: "2", change: "+8.2%", icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Under Verification", value: "4", change: "+3.1%", icon: <Factory className="h-4 w-4" /> },
    { label: "Qualified Suppliers", value: "7", change: "+11.0%", icon: <ArrowUpRight className="h-4 w-4" /> },
    { label: "Active Deals", value: "3", change: "+2", icon: <Warehouse className="h-4 w-4" /> },
    { label: "Monthly Supply Capacity", value: "18.6k MT", change: "+9.7%", icon: <ArrowUpRight className="h-4 w-4" /> },
  ];

  const relevantRequirement = buyerRequirements[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Overview</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Supplier intelligence dashboard</h1>
        </div>
        <Button className="w-fit">Export report</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <SourcingOverview />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Pipeline</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Supplier pipeline</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {statusOrder.map((status) => (
              <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{status}</span>
                  <StatusBadge label={status} />
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">{pipelineSummary[status]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Mineral supply</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Supply overview</h2>
          </div>

          <div className="space-y-3">
            {Object.entries(supplyOverview).map(([commodity, item]) => (
              <div key={commodity} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">{commodity}</div>
                  <StatusBadge label={commodity === "Copper" ? "QUALIFIED" : "ACTIVE"} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Suppliers</div>
                    <div className="mt-1 font-medium text-slate-900">{item.suppliers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Capacity</div>
                    <div className="mt-1 font-medium text-slate-900">{item.capacity.toLocaleString()} MT</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Qualified: <span className="font-semibold text-slate-900">{item.qualified.toLocaleString()} MT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Activity</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent supplier activity</h2>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="font-medium text-slate-900">{activity.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{activity.details}</div>
                </div>
                <div className="text-right text-xs text-slate-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority requirement</div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{relevantRequirement.title}</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span>Grade</span>
              <span className="font-semibold text-slate-900">≥ {relevantRequirement.minimumGradePercent}%</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span>Sulphur</span>
              <span className="font-semibold text-slate-900">≥ {relevantRequirement.minimumSulphurPercent ?? "—"}%</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span>Monthly demand</span>
              <span className="font-semibold text-slate-900">{relevantRequirement.monthlyQuantityMt.toLocaleString()} MT</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span>Destination</span>
              <span className="font-semibold text-slate-900">China</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
