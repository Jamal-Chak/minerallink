// Phase 7 — browser -> server import preview (pure, dry-run, no writes).
// Preview reports counts, conflicts, missing references, validation errors.
// Actual import lives in server-import-apply.ts (admin-confirmed only).
import { validateWorkspaceImport } from "@/lib/data/workspace-transfer";
import type { SupplierWorkspace } from "@/lib/data/workspace-model";

export interface ImportConflict {
  kind: string;
  id: string;
  detail: string;
}

export interface ImportPreview {
  suppliersToCreate: number;
  supplierConflicts: ImportConflict[];
  dealsToCreate: number;
  dealConflicts: ImportConflict[];
  activitiesToImport: number;
  communicationsToImport: number;
  followUpsToImport: number;
  informationRequestsToImport: number;
  matchSnapshotsToImport: number;
  missingReferences: string[];
  validationErrors: string[];
}

export function previewWorkspaceImport(raw: unknown): { preview: ImportPreview; workspace: SupplierWorkspace | null } {
  const validation = validateWorkspaceImport(raw);
  if (!validation.ok) {
    return {
      workspace: null,
      preview: {
        suppliersToCreate: 0, supplierConflicts: [], dealsToCreate: 0, dealConflicts: [],
        activitiesToImport: 0, communicationsToImport: 0, followUpsToImport: 0,
        informationRequestsToImport: 0, matchSnapshotsToImport: 0,
        missingReferences: [], validationErrors: validation.errors,
      },
    };
  }
  const workspace = validation.workspace;
  const supplierIds = new Set(workspace.suppliers.map((s) => s.id));
  const missingReferences: string[] = [];
  for (const deal of workspace.deals) {
    if (!supplierIds.has(deal.supplierId)) {
      missingReferences.push(`deal ${deal.id} references unknown supplier ${deal.supplierId}`);
    }
  }
  const activitiesToImport = Object.values(workspace.activities).reduce((n, list) => n + list.length, 0);
  const communicationsToImport = Object.values(workspace.communications).reduce((n, list) => n + list.length, 0);
  const matchSnapshotsToImport = workspace.deals.filter((d) => workspace.dealMetadata[d.id]?.matchResult).length;
  return {
    workspace,
    preview: {
      suppliersToCreate: workspace.suppliers.length,
      supplierConflicts: [],
      dealsToCreate: workspace.deals.length,
      dealConflicts: [],
      activitiesToImport,
      communicationsToImport,
      followUpsToImport: workspace.followUps.length,
      informationRequestsToImport: workspace.informationRequests.length,
      matchSnapshotsToImport,
      missingReferences,
      validationErrors: [],
    },
  };
}
