import { Button } from "@/components/ui/button";
import type { BuyerRequirement } from "@/lib/domain";

interface RequirementCardProps {
  requirement: BuyerRequirement;
}

export function RequirementCard({ requirement }: RequirementCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Buyer requirement</div>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{requirement.title}</h3>
        </div>
        <Button size="sm" variant="outline">Review</Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Commodity</div>
          <div className="mt-2 font-semibold text-slate-900">{requirement.commodity}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Product type</div>
          <div className="mt-2 font-semibold text-slate-900">{requirement.productType}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Minimum grade</div>
          <div className="mt-2 font-semibold text-slate-900">{requirement.minimumGradePercent}%</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Monthly</div>
          <div className="mt-2 font-semibold text-slate-900">{requirement.monthlyQuantityMt.toLocaleString()} MT</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Quality thresholds</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Cu ≥ {requirement.minimumGradePercent}%</li>
            <li>S ≥ {requirement.minimumSulphurPercent ?? "—"}%</li>
            <li>As ≤ {requirement.maximumImpurities.arsenic ?? "—"}%</li>
            <li>Cl ≤ {requirement.maximumImpurities.chlorine ?? "—"}%</li>
            <li>Cd ≤ {requirement.maximumImpurities.cadmium ?? "—"}%</li>
            <li>Hg ≤ {requirement.maximumImpurities.mercury ?? "—"}%</li>
            <li>F ≤ {requirement.maximumImpurities.fluorine ?? "—"}%</li>
            <li>Pb + Zn ≤ {requirement.maximumLeadPlusZincPercent ?? "—"}%</li>
            <li>Particle size ≤ {requirement.maximumParticleSizeMm ?? "—"} mm</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Commercial terms</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Trial: {requirement.trialQuantityMinMt ?? "—"}-{requirement.trialQuantityMaxMt ?? "—"} MT</li>
            <li>Destination: {requirement.destinationCountry}</li>
            <li>Ports: {requirement.destinationPorts.join(", ")}</li>
            <li>Incoterms: {requirement.incoterms.join(" / ")}</li>
            <li>Payment: {requirement.paymentMethods.join(" / ")}</li>
            <li>Inspection: {requirement.inspectionAgencies.join(" / ")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
