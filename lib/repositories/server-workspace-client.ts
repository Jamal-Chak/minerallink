// Phase 7 — server client adapter (browser-safe).
//
// Same conceptual contract as the browser repository, but async over HTTP:
// UI -> ServerWorkspaceClient -> /api/workspace/* -> Prisma operations.
// No Prisma import here; no database access from the browser. The browser
// repository remains the default; this client is used explicitly only when
// server mode has been proven.
import { getPersistenceMode } from "./persistence-mode";
import { PersistenceError, type PersistenceErrorCode } from "./persistence-errors";

export interface ServerCommandResponse {
  ok: boolean;
  data?: { id?: string; status?: string };
  error?: { code: PersistenceErrorCode; message: string; details?: string[] };
}

async function postCommand(command: string, payload: unknown): Promise<ServerCommandResponse> {
  const response = await fetch("/api/workspace/suppliers/commands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, payload }),
  });
  return (await response.json()) as ServerCommandResponse;
}

async function postDealCommand(command: string, payload: unknown): Promise<ServerCommandResponse> {
  const response = await fetch("/api/workspace/deals/commands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, payload }),
  });
  return (await response.json()) as ServerCommandResponse;
}

function throwIfError(response: ServerCommandResponse, fallback: string): { id?: string; status?: string } {
  if (response.ok) return response.data ?? {};
  throw new PersistenceError(response.error?.code ?? "UNKNOWN", response.error?.message ?? fallback);
}

export const ServerWorkspaceClient = {
  backend: "server-api" as const,
  isAvailable(): boolean {
    return getPersistenceMode() === "server";
  },
  async createSupplier(payload: Record<string, unknown>): Promise<string> {
    const data = throwIfError(await postCommand("supplier.create", payload), "Server supplier creation failed.");
    if (!data.id) throw new PersistenceError("UNKNOWN", "Server did not return a supplier id.");
    return data.id;
  },
  async verifySupplier(payload: Record<string, unknown>): Promise<void> {
    throwIfError(await postCommand("supplier.verify", payload), "Server verification failed.");
  },
  async movePipeline(payload: Record<string, unknown>): Promise<void> {
    throwIfError(await postCommand("supplier.pipeline", payload), "Server pipeline update failed.");
  },
  async createDeal(payload: Record<string, unknown>): Promise<string> {
    const data = throwIfError(await postDealCommand("deal.create", payload), "Server deal creation failed.");
    if (!data.id) throw new PersistenceError("UNKNOWN", "Server did not return a deal id.");
    return data.id;
  },
  async moveDealStage(payload: Record<string, unknown>): Promise<void> {
    throwIfError(await postDealCommand("deal.stage", payload), "Server deal stage update failed.");
  },
  async previewImport(envelope: unknown): Promise<unknown> {
    const response = await fetch("/api/workspace/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "preview", workspace: envelope }),
    });
    const body = (await response.json()) as ServerCommandResponse & { data?: { preview?: unknown } };
    if (!body.ok) throw new PersistenceError(body.error?.code ?? "UNKNOWN", body.error?.message ?? "Import preview failed.");
    return (body.data as { preview?: unknown } | undefined)?.preview ?? null;
  },
};
