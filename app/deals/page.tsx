import { DealsDashboard } from "@/components/deals/deals-dashboard";

export default function DealsPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Commercial pipeline</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Deals</h1>
        <p className="mt-1 text-sm text-slate-600">Track buyer introductions, offers, negotiation, shipment, payment, and commission milestones.</p>
      </div>
      <DealsDashboard />
    </div>
  );
}
