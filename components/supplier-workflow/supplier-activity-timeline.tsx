import type { SupplierActivity } from "@/lib/domain/supplier-workflow";

export function SupplierActivityTimeline({ items }: { items: SupplierActivity[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Activity timeline</h2>
          <p className="mt-1 text-xs text-slate-500">Workflow events are timestamped and retained in this browser demo.</p>
        </div>
        <span className="text-xs text-slate-500">{items.length} events</span>
      </div>
      {items.length ? (
        <ol className="space-y-0">
          {items.map((item, index) => (
            <li key={item.id} className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
              {index < items.length - 1 && <span className="absolute left-[6px] top-3 h-full w-px bg-slate-200" />}
              <span className="relative mt-1.5 h-3 w-3 rounded-full border-2 border-emerald-700 bg-white" />
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-slate-900">{item.title}</span>
                  <time className="text-xs text-slate-500" dateTime={item.createdAt}>{item.createdAt.slice(0, 16).replace("T", " ")} UTC</time>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{item.details}</p>
                <p className="mt-1 text-[10px] text-slate-500">Actor: {item.actorName ?? "System / development fixture"}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-slate-500">No activity recorded yet.</p>}
    </section>
  );
}
