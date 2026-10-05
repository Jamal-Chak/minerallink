import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "UNDER REVIEW": "bg-amber-100 text-amber-700 ring-amber-200",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 ring-amber-200",
  NOT_CONTACTED: "bg-slate-100 text-slate-700 ring-slate-200",
  "NOT CONTACTED": "bg-slate-100 text-slate-700 ring-slate-200",
  OUTREACH_SENT: "bg-sky-100 text-sky-700 ring-sky-200",
  "OUTREACH SENT": "bg-sky-100 text-sky-700 ring-sky-200",
  AWAITING_RESPONSE: "bg-amber-100 text-amber-700 ring-amber-200",
  "AWAITING RESPONSE": "bg-amber-100 text-amber-700 ring-amber-200",
  FOLLOW_UP_REQUIRED: "bg-orange-100 text-orange-700 ring-orange-200",
  "FOLLOW UP REQUIRED": "bg-orange-100 text-orange-700 ring-orange-200",
  IN_DISCUSSION: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  "IN DISCUSSION": "bg-indigo-100 text-indigo-700 ring-indigo-200",
  NO_RESPONSE: "bg-rose-100 text-rose-700 ring-rose-200",
  "NO RESPONSE": "bg-rose-100 text-rose-700 ring-rose-200",
  DECLINED: "bg-slate-200 text-slate-700 ring-slate-300",
  URGENT: "bg-rose-100 text-rose-700 ring-rose-200",
  OVERDUE: "bg-rose-100 text-rose-700 ring-rose-200",
  HIGH: "bg-orange-100 text-orange-700 ring-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 ring-amber-200",
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  OPEN: "bg-sky-100 text-sky-700 ring-sky-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-slate-200 text-slate-700 ring-slate-300",
  UNVERIFIED: "bg-slate-200 text-slate-700 ring-slate-300",
  REJECTED: "bg-rose-100 text-rose-700 ring-rose-200",
  QUALIFIED: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  NEW: "bg-sky-100 text-sky-700 ring-sky-200",
  CONTACTED: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  RESPONDED: "bg-violet-100 text-violet-700 ring-violet-200",
  DOCUMENTS_REQUESTED: "bg-amber-100 text-amber-700 ring-amber-200",
  UNDER_VERIFICATION: "bg-orange-100 text-orange-700 ring-orange-200",
  MATCH: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  PARTIAL: "bg-amber-100 text-amber-700 ring-amber-200",
  "NO MATCH": "bg-rose-100 text-rose-700 ring-rose-200",
  PASS: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  FAIL: "bg-rose-100 text-rose-700 ring-rose-200",
  MISSING: "bg-slate-200 text-slate-700 ring-slate-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 ring-amber-200",
  MISSING_DOC: "bg-slate-200 text-slate-700 ring-slate-300",
};

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  const accent = badgeStyles[label] ?? "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset uppercase tracking-[0.14em]",
        accent,
        className,
      )}
    >
      {label}
    </span>
  );
}
