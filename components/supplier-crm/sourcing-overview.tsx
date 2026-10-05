"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { useSupplierWorkspace } from "@/lib/data/use-supplier-workspace";
import type { FollowUpPriority, SupplierFollowUp } from "@/lib/domain/supplier-workflow";

const today = new Date().toISOString().slice(0, 10);
const priorityOrder: Record<FollowUpPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function SourcingOverview() {
  const { workspace } = useSupplierWorkspace();
  const openTasks = workspace.followUps.filter((task) => task.status === "OPEN");
  const dueToday = openTasks.filter((task) => task.dueAt.slice(0, 10) === today);
  const overdue = openTasks.filter((task) => task.dueAt.slice(0, 10) < today);
  const awaiting = workspace.suppliers.filter((supplier) => workspace.outreachStatuses[supplier.id] === "AWAITING_RESPONSE");
  const discussing = workspace.suppliers.filter((supplier) => workspace.outreachStatuses[supplier.id] === "IN_DISCUSSION");
  const dueActions = [...overdue, ...dueToday].sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || left.dueAt.localeCompare(right.dueAt));
  const actions: Array<{ id: string; supplierId: string; action: string; priority: FollowUpPriority; due: string; task?: SupplierFollowUp }> = dueActions.map((task) => ({ id: task.id, supplierId: task.supplierId, action: task.action, priority: task.priority, due: task.dueAt.slice(0, 10), task }));
  for (const supplier of workspace.suppliers.filter((item) => (workspace.outreachStatuses[item.id] ?? "NOT_CONTACTED") === "NOT_CONTACTED")) {
    if (actions.length >= 4) break;
    actions.push({ id: `outreach-${supplier.id}`, supplierId: supplier.id, action: "Log initial supplier outreach", priority: "HIGH", due: "No due date", });
  }
  const todayActions = actions.slice(0, 4);
  const metrics = [
    { label: "Awaiting response", value: awaiting.length, href: "/outreach", detail: "supplier records" },
    { label: "Follow-ups due today", value: dueToday.length, href: "/follow-ups", detail: "open actions" },
    { label: "Overdue follow-ups", value: overdue.length, href: "/follow-ups", detail: "open actions" },
    { label: "In discussion", value: discussing.length, href: "/outreach", detail: "supplier records" },
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Sourcing pulse</div><h2 className="mt-1 text-sm font-semibold text-slate-900">Outreach and follow-up</h2></div><Link href="/outreach" className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">Open queue <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {metrics.map((metric) => <Link key={metric.label} href={metric.href} className="rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"><div className="text-[10px] font-medium uppercase leading-4 tracking-wide text-slate-500">{metric.label}</div><div className="mt-1 flex items-baseline gap-1.5"><span className="text-xl font-semibold text-slate-900">{metric.value}</span><span className="text-[10px] text-slate-500">{metric.detail}</span></div></Link>)}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Priority actions</div><h2 className="mt-1 text-sm font-semibold text-slate-900">Today&apos;s actions</h2></div><Link href="/follow-ups" className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">All follow-ups <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        <div className="mt-2 divide-y divide-slate-100">
          {todayActions.length ? todayActions.map((action) => {
            const supplier = workspace.suppliers.find((item) => item.id === action.supplierId);
            if (!supplier) return null;
            return <Link key={action.id} href={`/suppliers/${supplier.id}#outreach`} className="flex items-center justify-between gap-2 py-2 hover:bg-slate-50">
              <span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-900">{supplier.companyName}</span><span className="block truncate text-[11px] text-slate-600">{action.action}</span></span>
              <span className="flex shrink-0 flex-col items-end gap-1">{action.task && action.due < today && <StatusBadge label="OVERDUE" />}<StatusBadge label={action.priority} /><span className="text-[10px] text-slate-500">{action.due}</span></span>
            </Link>;
          }) : <p className="py-3 text-xs text-slate-500">No sourcing actions due today.</p>}
        </div>
      </div>
    </section>
  );
}
