import { RequirementCard } from "@/components/requirement-card";
import { buyerRequirements } from "@/lib/data/demo-data";

export default function RequirementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Buyer requirements</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Buyer requirements</h1>
      </div>

      <div className="space-y-5">
        {buyerRequirements.map((requirement) => (
          <RequirementCard key={requirement.id} requirement={requirement} />
        ))}
      </div>
    </div>
  );
}
