import { FollowUpQueue } from "@/components/supplier-crm/follow-up-queue";

export default function FollowUpsPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sourcing actions</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Follow-ups</h1>
        <p className="mt-1 text-sm text-slate-600">Track due dates and close out supplier actions. No notifications are sent.</p>
      </div>
      <FollowUpQueue />
    </div>
  );
}
