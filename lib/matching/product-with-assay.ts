import type { MineralProduct } from "@/lib/domain";
import type { SupplierAssay } from "@/lib/domain/supplier-workflow";

export function productWithAssay(product: MineralProduct, assay?: SupplierAssay): MineralProduct {
  if (!assay) return product;
  return {
    ...product,
    specification: {
      ...product.specification,
      gradePercent: assay.gradePercent,
      sulphurPercent: assay.sulphurPercent,
      particleSizeMm: assay.particleSizeMm,
      impurities: {
        arsenic: assay.arsenicPercent,
        chlorine: assay.chlorinePercent,
        cadmium: assay.cadmiumPercent,
        mercury: assay.mercuryPercent,
        fluorine: assay.fluorinePercent,
        lead: assay.leadPercent,
        zinc: assay.zincPercent,
      },
    },
  };
}
