// Phase 7 — import route: preview (dry-run) + apply (admin-confirmed).
// POST /api/workspace/import { mode: "preview" | "apply", workspace? }
// - preview: validates + reports counts/conflicts, never writes.
// - apply: requires user.manage, validates, then idempotent upsert import.
import { prisma } from "@/lib/db";
import { ok, persistenceFailure, readSessionCookie, serverActorFromCookie } from "@/lib/repositories/server-route-helpers";
import { previewWorkspaceImport } from "@/lib/repositories/server-import";
import { importSuppliersToServer } from "@/lib/repositories/server-import-apply";
import { importCrmAndDealsToServer } from "@/lib/repositories/server-import-apply-deals";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["preview", "apply"]),
  workspace: z.unknown().optional(),
  envelope: z.unknown().optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const cookie = readSessionCookie(request);
    const raw = (await request.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return persistenceFailure("import.parse", parsed.error);
    const payload = parsed.data.workspace ?? parsed.data.envelope ?? parsed.data;

    if (parsed.data.mode === "preview") {
      serverActorFromCookie(cookie, "settings.read");
      const { preview } = previewWorkspaceImport(payload);
      return ok({ preview });
    }

    const actor = serverActorFromCookie(cookie, "user.manage");
    const { preview, workspace } = previewWorkspaceImport(payload);
    if (!workspace || preview.validationErrors.length > 0) {
      return persistenceFailure("import.validation", new Error(preview.validationErrors.join("; ") || "Invalid workspace payload."));
    }
    if (preview.missingReferences.length > 0) {
      return persistenceFailure("import.references", new Error(preview.missingReferences.join("; ")));
    }
    const suppliers = await importSuppliersToServer(prisma, workspace, actor);
    const deals = await importCrmAndDealsToServer(prisma, workspace);
    return ok({
      preview,
      importedSuppliers: suppliers.importedSuppliers,
      importedDeals: deals.importedDeals,
      skippedConflicts: suppliers.supplierConflicts.length + deals.dealConflicts.length,
      supplierConflicts: suppliers.supplierConflicts,
      dealConflicts: deals.dealConflicts,
    });
  } catch (error) {
    return persistenceFailure("import.apply", error);
  }
}
