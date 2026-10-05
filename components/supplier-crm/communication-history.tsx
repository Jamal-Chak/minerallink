"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

import { CommunicationForm } from "@/components/supplier-crm/communication-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { updateSupplierOutreachStatus, updateSupplierPipeline } from "@/lib/data/supplier-workspace";
import { useAuth } from "@/components/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import type { Supplier } from "@/lib/domain";
import { SUPPLIER_OUTREACH_STATUSES, type SupplierCommunication, type SupplierOutreachStatus } from "@/lib/domain/supplier-workflow";

const outreachOptions = SUPPLIER_OUTREACH_STATUSES.map((status) => ({ value: status, label: status.replaceAll("_", " ") }));
const pipelineSuggestions = { OUTBOUND: "CONTACTED", INBOUND: "RESPONDED" } as const;

export function CommunicationHistory({
  supplier,
  communications,
  outreachStatus,
}: {
  supplier: Supplier;
  communications: SupplierCommunication[];
  outreachStatus: SupplierOutreachStatus;
}) {
  const { user } = useAuth();
  const canLog = can(user, "outreach.log");
  const canManagePipeline = can(user, "supplier.pipeline.manage");
  const [suggestion, setSuggestion] = useState<"CONTACTED" | "RESPONDED" | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Outreach / communications</h2>
          <p className="mt-1 text-xs text-slate-500">Internal interaction records only. No external sending integration is configured.</p>
        </div>
        <label className="text-xs font-medium text-slate-600">Outreach status
          <select aria-label="Outreach status" disabled={!canLog} value={outreachStatus} onChange={(event) => updateSupplierOutreachStatus(supplier.id, event.target.value as SupplierOutreachStatus)} className="mt-1 block h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 disabled:bg-slate-100">
            {outreachOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {canLog ? <details className="mt-4">
        <summary className="flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 text-sm font-medium text-white hover:bg-emerald-900"><MessageSquarePlus className="h-4 w-4" /> Log Communication</summary>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <CommunicationForm supplier={supplier} onSaved={(direction) => setSuggestion(pipelineSuggestions[direction])} />
        </div>
      </details> : <p className="mt-3 text-xs text-slate-500">Communication logging is read-only for your role.</p>}

      {canManagePipeline && suggestion && supplier.pipelineStatus !== suggestion && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
          <span className="text-sky-950">Suggested pipeline stage: <strong>{suggestion}</strong>. This is separate from outreach status.</span>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => { updateSupplierPipeline(supplier.id, suggestion); setSuggestion(null); }}>Apply suggestion</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setSuggestion(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Communication history · {communications.length}</h3>
        {!communications.length ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No communications logged.</p> : communications.map((communication) => {
          const contact = supplier.contacts.find((item) => item.id === communication.contactId);
          return (
            <article key={communication.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge label={`${communication.type} · ${communication.direction}`} /><StatusBadge label={communication.isDemoFixture ? "SYNTHETIC SCENARIO" : "INTERNAL LOG"} /></div>
                <time className="text-xs text-slate-500" dateTime={communication.occurredAt}>{new Date(communication.occurredAt).toLocaleString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} UTC</time>
              </div>
              <h4 className="mt-2 font-medium text-slate-900">{communication.subject}</h4>
              <p className="mt-1 text-sm leading-5 text-slate-700">{communication.summary}</p>
              {contact && <p className="mt-2 text-xs text-slate-500">Contact: {contact.name}</p>}
              {communication.outcome && <p className="mt-2 text-xs text-slate-600"><strong>Outcome:</strong> {communication.outcome}</p>}
              {communication.nextAction && <p className="mt-1 text-xs text-slate-600"><strong>Next action:</strong> {communication.nextAction}{communication.followUpDate ? ` · ${communication.followUpDate}` : ""}</p>}
              {communication.internalNotes && <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">Internal note: {communication.internalNotes}</p>}
              <p className="mt-2 text-[11px] text-amber-800">Internal log only · MineralLink did not send this communication.</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
