// Phase 7 — shared server-repository helpers (server-only).
// Optimistic-concurrency guard + id helpers shared by operation modules.
import { PersistenceError } from "./persistence-errors";

export function newId(prefix: string): string {
  const raw = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${raw}`;
}

export function checkConcurrency(currentUpdatedAt: Date, expectedUpdatedAt?: string): void {
  if (!expectedUpdatedAt) return;
  if (currentUpdatedAt.toISOString() !== expectedUpdatedAt) {
    throw new PersistenceError("CONFLICT", "The record changed since it was read. Refresh and retry.");
  }
}
