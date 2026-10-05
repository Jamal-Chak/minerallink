import { StatusBadge } from "@/components/status-badge";

interface VerificationItem {
  id: string;
  label: string;
  status: "VERIFIED" | "PENDING" | "MISSING" | "REJECTED";
}

export function SupplierVerificationPanel({ items }: { items: VerificationItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Verification</div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Due diligence checklist</h3>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-sm text-slate-700">{item.label}</span>
            <StatusBadge label={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
