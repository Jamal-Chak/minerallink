// Phase 7 — match evidence mapping (pure).
//
// Matching itself stays computed in `lib/matching`. The server persists only
// immutable snapshots attached to deals (`Deal.matchResult` JSON) plus an
// audit activity row — never a "computed match as permanent truth".
import type { MineralMatchResult } from "@/lib/matching/types";
import { assertId } from "./decimal-mapping";

export interface MatchSnapshotRecord {
  id: string;
  dealId: string;
  requirementId: string;
  productId: string;
  status: MineralMatchResult["status"];
  passed: number;
  failed: number;
  missing: number;
  checks: MineralMatchResult["checks"];
  evidenceSource?: string;
  createdAt: string;
  actorUserId?: string;
  actorName?: string;
}

export function buildMatchSnapshot(input: {
  id: string;
  dealId: string;
  result: MineralMatchResult;
  evidenceSource?: string;
  actorUserId?: string;
  actorName?: string;
  createdAt?: string;
}): MatchSnapshotRecord {
  assertId(input.id, "match snapshot id");
  assertId(input.dealId, "deal id");
  return {
    id: input.id,
    dealId: input.dealId,
    requirementId: input.result.requirementId,
    productId: input.result.productId,
    status: input.result.status,
    passed: input.result.passed,
    failed: input.result.failed,
    missing: input.result.missing,
    checks: input.result.checks.map((check) => ({ ...check })),
    evidenceSource: input.evidenceSource,
    createdAt: input.createdAt ?? new Date().toISOString(),
    actorUserId: input.actorUserId,
    actorName: input.actorName,
  };
}

export function snapshotToJson(snapshot: MatchSnapshotRecord): Record<string, unknown> {
  return {
    id: snapshot.id,
    requirementId: snapshot.requirementId,
    productId: snapshot.productId,
    status: snapshot.status,
    passed: snapshot.passed,
    failed: snapshot.failed,
    missing: snapshot.missing,
    checks: snapshot.checks,
    evidenceSource: snapshot.evidenceSource ?? null,
    createdAt: snapshot.createdAt,
    actorUserId: snapshot.actorUserId ?? null,
    actorName: snapshot.actorName ?? null,
  };
}
