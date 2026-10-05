import { MatchResultCard } from "@/components/match-result-card";
import { buyerRequirements, supplierProducts, supplierProfiles } from "@/lib/data/demo-data";
import { matchMineralProduct } from "@/lib/matching";

export default function MatchingPage() {
  const requirement = buyerRequirements[0];
  const results = supplierProfiles
    .map((supplier) => {
      const product = supplierProducts[supplier.id]?.[0];
      if (!product) {
        return null;
      }

      return {
        supplierName: supplier.companyName,
        supplierId: supplier.id,
        productId: product.id,
        requirementId: requirement.id,
        result: matchMineralProduct(product, requirement),
      };
    })
    .filter((item): item is { supplierName: string; supplierId: string; productId: string; requirementId: string; result: ReturnType<typeof matchMineralProduct> } => item !== null);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Matching</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Mineral matching</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {results.map((entry) => (
          <MatchResultCard key={entry.supplierName} supplierName={entry.supplierName} result={entry.result} createDealHref={`/deals/new?supplierId=${entry.supplierId}&productId=${entry.productId}&requirementId=${entry.requirementId}&fromMatch=1`} />
        ))}
      </div>
    </div>
  );
}
