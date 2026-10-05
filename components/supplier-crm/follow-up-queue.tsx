"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Clock3, X } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useSupplierWorkspace } from "@/lib/data/use-supplier-workspace";
import { updateFollowUpStatus } from "@/lib/data/supplier-workspace";
import { can } from "@/lib/auth/permissions";
import type { FollowUpPriority, SupplierFollowUp } from "@/lib/domain/supplier-workflow";

const priorityOrder: Record<FollowUpPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const today = new Date().toISOString().slice(0, 10);
const dateFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

function TaskRows({ tasks, title, description }: { tasks: SupplierFollowUp[]; title: string; description: string }) {
  const { workspace } = useSupplierWorkspace();
  const { user } = useAuth();
  const canManage = can(user, "followup.manage");
  const sorted = [...tasks].sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || left.dueAt.localeCompare(right.dueAt));
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">{title} <span className="ml-1 text-xs font-normal text-slate-500">{tasks.length}</span></h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>
      {sorted.length ? <div className="divide-y divide-slate-100">
        {sorted.map((task) => {
          const supplier = workspace.suppliers.find((item) => item.id === task.supplierId);
          if (!supplier) return null;
          const product = workspace.products[task.supplierId]?.[0];
          const contact = supplier.contacts.find((item) => item.id === task.contactId);
          const overdue = task.status === "OPEN" && task.dueAt.slice(0, 10) < today;
          return <div key={task.id} className={`grid gap-3 p-4 lg:grid-cols-[minmax(180px,1.1fr)_minmax(100px,0.6fr)_minmax(140px,1.3fr)_120px_100px_130px] lg:items-center ${overdue ? "border-l-4 border-l-rose-600 bg-rose-50/40" : ""}`}>
            <div><Link href={`/suppliers/${supplier.id}#outreach`} className="font-semibold text-slate-900 hover:text-emerald-800">{supplier.companyName}</Link>{task.isDemoFixture && <div className="mt-1 text-[9px] font-semibold uppercase text-amber-800">Synthetic scenario</div>}<div className="mt-1 text-xs text-slate-500">{supplier.country} · {product?.specification.commodity ?? "No mineral"} · {contact?.name ?? "No contact"}</div></div>
            <div className="flex items-center gap-2 text-xs"><Clock3 className="h-3.5 w-3.5 text-slate-400" /><span className={overdue ? "font-semibold text-rose-800" : "text-slate-700"}>{dateFormatter.format(new Date(`${task.dueAt.slice(0, 10)}T12:00:00.000Z`))}{overdue ? " · Overdue" : ""}</span></div>
            <div className="text-sm text-slate-800">{task.action}<div className="mt-1 text-xs text-slate-500">Owner: {task.owner}</div></div>
            <StatusBadge label={task.priority} />
            <StatusBadge label={supplier.pipelineStatus} />
            {task.status === "OPEN" && canManage ? <div className="flex gap-2"><Button type="button" size="sm" title="Mark follow-up complete" aria-label={`Complete follow-up for ${supplier.companyName}`} onClick={() => updateFollowUpStatus(task.id, "COMPLETED")}><Check className="h-4 w-4" /></Button><Button type="button" size="sm" variant="outline" title="Cancel follow-up" aria-label={`Cancel follow-up for ${supplier.companyName}`} onClick={() => updateFollowUpStatus(task.id, "CANCELLED")}><X className="h-4 w-4" /></Button></div> : <span className="text-xs text-slate-500">{task.status === "OPEN" ? "Open · read-only" : `${task.status}${task.completedAt ? ` · ${task.completedAt.slice(0, 10)}` : ""}`}</span>}
          </div>;
        })}
      </div> : <p className="p-4 text-sm text-slate-500">No follow-ups in this section.</p>}
    </section>
  );
}

export function FollowUpQueue() {
  const { workspace } = useSupplierWorkspace();
  const [showCompleted, setShowCompleted] = useState(true);
  const groups = useMemo(() => {
    const open = workspace.followUps.filter((task) => task.status === "OPEN");
    return {
      overdue: open.filter((task) => task.dueAt.slice(0, 10) < today),
      dueToday: open.filter((task) => task.dueAt.slice(0, 10) === today),
      upcoming: open.filter((task) => task.dueAt.slice(0, 10) > today),
      completed: workspace.followUps.filter((task) => task.status !== "OPEN"),
    };
  }, [workspace.followUps]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Due today", groups.dueToday.length, "text-slate-900"], ["Overdue", groups.overdue.length, "text-rose-700"],
          ["Upcoming", groups.upcoming.length, "text-slate-900"], ["Completed", groups.completed.filter((task) => task.status === "COMPLETED").length, "text-emerald-800"],
        ].map(([label, count, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className={`mt-1 text-2xl font-semibold ${color}`}>{count}</div></div>)}
      </div>
      <TaskRows tasks={groups.overdue} title="Overdue" description="Open actions past their due date" />
      <TaskRows tasks={groups.dueToday} title="Due today" description="Open actions due today" />
      <TaskRows tasks={groups.upcoming} title="Upcoming" description="Scheduled open follow-ups" />
      <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => setShowCompleted((current) => !current)}>{showCompleted ? "Hide completed" : "Show completed"}</Button></div>
      {showCompleted && <TaskRows tasks={groups.completed} title="Completed and cancelled" description="Closed follow-up records" />}
    </div>
  );
}
