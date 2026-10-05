import type {
  BuyerRequirement,
  MineralImpurities,
  MineralProduct,
} from "../domain";

import type {
  MatchCheck,
  MatchCheckStatus,
  MineralMatchResult,
} from "./types";

function minCheck(
  field: string,
  label: string,
  actual: number | undefined,
  required: number,
): MatchCheck {
  let status: MatchCheckStatus;

  if (actual === undefined) {
    status = "MISSING";
  } else if (actual >= required) {
    status = "PASS";
  } else {
    status = "FAIL";
  }

  return {
    field,
    label,
    status,
    actual: actual ?? null,
    required,
    operator: "MIN",
  };
}

function maxCheck(
  field: string,
  label: string,
  actual: number | undefined,
  required: number,
): MatchCheck {
  let status: MatchCheckStatus;

  if (actual === undefined) {
    status = "MISSING";
  } else if (actual <= required) {
    status = "PASS";
  } else {
    status = "FAIL";
  }

  return {
    field,
    label,
    status,
    actual: actual ?? null,
    required,
    operator: "MAX",
  };
}

const impurityLabels: Record<keyof MineralImpurities, string> = {
  arsenic: "Arsenic",
  chlorine: "Chlorine",
  cadmium: "Cadmium",
  mercury: "Mercury",
  fluorine: "Fluorine",
  lead: "Lead",
  zinc: "Zinc",
};

export function matchMineralProduct(
  product: MineralProduct,
  requirement: BuyerRequirement,
): MineralMatchResult {
  const checks: MatchCheck[] = [];
  const specification = product.specification;

  checks.push({
    field: "commodity",
    label: "Commodity",
    status:
      specification.commodity === requirement.commodity
        ? "PASS"
        : "FAIL",
    actual: specification.commodity,
    required: requirement.commodity,
    operator: "EQUAL",
  });

  checks.push({
    field: "productType",
    label: "Product type",
    status:
      specification.productType === requirement.productType
        ? "PASS"
        : "FAIL",
    actual: specification.productType,
    required: requirement.productType,
    operator: "EQUAL",
  });

  checks.push(
    minCheck(
      "gradePercent",
      `${requirement.commodity} grade`,
      specification.gradePercent,
      requirement.minimumGradePercent,
    ),
  );

  if (requirement.minimumSulphurPercent !== undefined) {
    checks.push(
      minCheck(
        "sulphurPercent",
        "Sulphur",
        specification.sulphurPercent,
        requirement.minimumSulphurPercent,
      ),
    );
  }

  for (const [key, maximum] of Object.entries(
    requirement.maximumImpurities,
  )) {
    if (maximum === undefined) {
      continue;
    }

    const impurity = key as keyof MineralImpurities;

    checks.push(
      maxCheck(
        `impurities.${impurity}`,
        impurityLabels[impurity],
        specification.impurities[impurity],
        maximum,
      ),
    );
  }

  if (requirement.maximumLeadPlusZincPercent !== undefined) {
    const lead = specification.impurities.lead;
    const zinc = specification.impurities.zinc;

    const combined =
      lead === undefined || zinc === undefined
        ? undefined
        : lead + zinc;

    checks.push(
      maxCheck(
        "impurities.leadPlusZinc",
        "Lead + Zinc",
        combined,
        requirement.maximumLeadPlusZincPercent,
      ),
    );
  }

  if (requirement.maximumParticleSizeMm !== undefined) {
    checks.push(
      maxCheck(
        "particleSizeMm",
        "Particle size",
        specification.particleSizeMm,
        requirement.maximumParticleSizeMm,
      ),
    );
  }

  if (
    requirement.acceptedMineralForms &&
    requirement.acceptedMineralForms.length > 0
  ) {
    const form = specification.mineralForm;

    checks.push({
      field: "mineralForm",
      label: "Mineral form",
      status:
        form === undefined
          ? "MISSING"
          : requirement.acceptedMineralForms.includes(form)
            ? "PASS"
            : "FAIL",
      actual: form ?? null,
      required: requirement.acceptedMineralForms.join(" / "),
      operator: "IN",
    });
  }

  if (
    requirement.trialQuantityMinMt !== undefined &&
    requirement.trialQuantityMaxMt !== undefined
  ) {
    const trialQuantity = product.trialQuantityMt;

    checks.push({
      field: "trialQuantityMt",
      label: "Trial quantity",
      status:
        trialQuantity === undefined
          ? "MISSING"
          : trialQuantity >= requirement.trialQuantityMinMt &&
              trialQuantity <= requirement.trialQuantityMaxMt
            ? "PASS"
            : "FAIL",
      actual: trialQuantity ?? null,
      required:
        `${requirement.trialQuantityMinMt}-${requirement.trialQuantityMaxMt} MT`,
      operator: "IN",
    });
  }

  checks.push(
    minCheck(
      "monthlyCapacityMt",
      "Monthly capacity",
      product.monthlyCapacityMt,
      requirement.monthlyQuantityMt,
    ),
  );

  checks.push({
    field: "availableForExport",
    label: "Available for export",
    status: product.availableForExport ? "PASS" : "FAIL",
    actual: product.availableForExport,
    required: true,
    operator: "EQUAL",
  });

  const passed = checks.filter(
    (check) => check.status === "PASS",
  ).length;

  const failed = checks.filter(
    (check) => check.status === "FAIL",
  ).length;

  const missing = checks.filter(
    (check) => check.status === "MISSING",
  ).length;

  const status =
    failed > 0
      ? "NO_MATCH"
      : missing > 0
        ? "PARTIAL"
        : "MATCH";

  return {
    productId: product.id,
    requirementId: requirement.id,
    status,
    checks,
    passed,
    failed,
    missing,
  };
}

