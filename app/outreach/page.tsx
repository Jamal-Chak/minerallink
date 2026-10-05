import { OutreachQueue } from "@/components/supplier-crm/outreach-queue";

export default function OutreachPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Supplier sourcing</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Outreach queue</h1>
        <p className="mt-1 text-sm text-slate-600">Prioritize supplier contacts, response tracking, and next actions.</p>
      </div>
      <OutreachQueue />
    </div>
  );
}
