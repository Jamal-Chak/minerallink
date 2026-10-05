export type MatchCheckStatus = "PASS" | "FAIL" | "MISSING";

export type MatchOperator =
  | "MIN"
  | "MAX"
  | "EQUAL"
  | "IN";

export interface MatchCheck {
  field: string;
  label: string;
  status: MatchCheckStatus;

  actual: number | string | boolean | null;
  required: number | string | boolean;

  operator: MatchOperator;
}

export type OverallMatchStatus =
  | "MATCH"
  | "PARTIAL"
  | "NO_MATCH";

export interface MineralMatchResult {
  productId: string;
  requirementId: string;

  status: OverallMatchStatus;

  checks: MatchCheck[];

  passed: number;
  failed: number;
  missing: number;
}
