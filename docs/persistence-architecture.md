# Persistence Architecture (Phase 6)

Status: **prepared, not activated.** The application still runs entirely on the
browser workspace. The database schema and server-side helpers exist so a later
phase can activate server persistence without another domain-modeling pass.
No database command (`migrate`, `db push`, `seed`) was executed in Phase 6, and
`prisma.config.ts` / credentials were not modified.

## 1. Layer overview

```
components (unchanged)
    │  import mutation functions
    ▼
lib/data/supplier-workspace.ts      ← all mutations, permission checks (unchanged API)
    │  read / write / subscribe
    ▼
lib/repositories/                   ← WorkspaceRepository interface + registry
    │
    ├── BrowserWorkspaceRepository  ← ACTIVE (localStorage, v3 keys)
    └── server-api adapter          ← reserved, not implemented yet
         uses lib/data/workspace-model.ts (pure aggregate, seed, normalization)
```

- `lib/data/workspace-model.ts` — pure, side-effect-free: `SupplierWorkspace`
  interface, storage keys (`minerallink:supplier-workspace:v1|v2|v3`),
  change-event name, `checkDefinitions`, `initialWorkspace()` (seed) and
  `normalizeStoredWorkspace()` (the exact migration/backfill pass that used to
  live inline in `supplier-workspace.ts`).
- `lib/repositories/types.ts` — `WorkspaceRepository` (`backend`, `read`,
  `write`, `subscribe`) and `WorkspaceBackend` (`"browser-localstorage"`,
  `"server-api"` reserved).
- `lib/repositories/browser-workspace-repository.ts` — the localStorage
  adapter. Behaviour is byte-for-byte the original implementation: v3 → v2 → v1
  key fallback, normalize-and-rewrite with change event only when the stored
  value actually changes, seeded fallback on empty/corrupt storage, SSR guard.
- `lib/repositories/index.ts` — registry: `getWorkspaceRepository()` /
  `setWorkspaceRepository()` for tests and future backend activation.

Public API and localStorage keys are unchanged; no component was modified.

## 2. Workspace contract details

- Version: `3`; unknown fields in stored payloads are preserved (spreads).
- Read path convergence: a freshly seeded payload gains per-supplier
  `assays`/`documents` entries on the first normalize pass (this was the
  pre-existing behaviour too), then becomes fully stable — verified by test.
- Subscribe: same-tab `minerallink:supplier-workspace-change` CustomEvent plus
  cross-tab `storage` events; `subscribe()` returns the unsubscribe function.
- `SupplierWorkspace` is still re-exported from
  `lib/data/supplier-workspace.ts`, so `useSupplierWorkspace` and all components
  are untouched.

## 3. Export / import (`lib/data/workspace-transfer.ts`)

Envelope: `{ format: "minerallink.supplier-workspace", version: 3, exportedAt, workspace }`.

- `exportWorkspace()` / `exportWorkspaceJson()` — permission `settings.read`.
- `validateWorkspaceImport(raw)` — pure zod v4 validation (no storage writes),
  safe for UI preflight. Loose objects: required invariants are checked
  (ids, enum values, parseable timestamps, `suppliers` required); unknown
  fields are accepted and preserved. Collections missing from older export
  versions (v1/v2) are optional and backfilled by the normal normalization pass.
- `importWorkspace(raw, strategy)` — permission `user.manage`; explicit
  strategy, never silent:
  - `"replace"` — validated payload becomes the workspace;
  - `"merge"` — additive union by id: **current records win on conflicts**,
    incoming only adds; activity feeds are never truncated (re-sorted
    newest-first); scalar maps keep current values.
- Ids, timestamps and append-only activity history survive both strategies.
- Malformed payloads throw `WorkspaceImportError` with per-path messages.
- No import/export UI was added in Phase 6 (no UI redesign); the API is ready.

## 4. Prisma schema expansion (readiness only)

Added to `prisma/schema.prisma` (pre-Phase-6 copy: `docs/schema.before-phase6.prisma`):

- Models: `User`, `SupplierActivity`, `SupplierVerificationCheck`,
  `SupplierCommunication`, `SupplierFollowUp`, `SupplierInformationRequest`,
  `SupplierInformationItemStatus`, `DealCommercialTerms`,
  `DealNegotiationRound`, `BuyerIntroduction`, `DealShipment`,
  `DealInspectionMilestone`, `DealPaymentMilestone`, `DealCommission`,
  `DealActivity`.
- Additive columns: `Supplier` (+outreachStatus, source, metadata fields),
  `Deal` (+supplyType, destination, match fields), `SupplierDocument`
  (+status, storageState; `fileUrl` made optional — widening only).
- Enums mirror `lib/domain/*` const arrays one-to-one (incl. `UserRole`,
  `UserStatus`, `SupplierActivityType`, `DealActivityType`).
- Design notes: workflow child rows cascade on supplier/deal deletion;
  `actorUserId` deliberately has **no FK** (append-only history must survive
  user deletion and fixture imports); contact/requirement ids are free strings
  because fixture ids are not rows; user-entered dates are `String` (exact
  fidelity), system timestamps are `DateTime`; money columns use the existing
  `Decimal` precision conventions.

Migration SQL: `prisma/migrations/<ts>_phase6_domain_expansion/migration.sql`,
generated **offline** via `prisma migrate diff --from-schema docs/schema.before-phase6.prisma
--to-schema prisma/schema.prisma --script`. Audit: 21 CreateEnum, 15 CreateTable,
3 AlterTable (ADD COLUMN only), 25 CreateIndex, 14 AddForeignKey, and exactly
one `DROP NOT NULL` (SupplierDocument.fileUrl widening) — **no destructive
statements**. It is written but **never applied**; `prisma generate` (offline)
was run to refresh `lib/generated/prisma`.

## 5. Server-side authorization (prepared, not wired to routes)

`lib/auth/server-authorization.ts` — reuses the Phase 5 cookie
(`minerallink-dev-session`) and role/permission matrix; no new auth system:

- `resolveServerSession(cookieValue)` — dev-only session → user;
- `requireServerSession(cookieValue)` — throws the session-required error;
- `requireServerPermission(cookieValue, permission)` — `assertCan` semantics
  (session error vs `PermissionDeniedError`).

Usage pattern for future write routes is documented in the module JSDoc
(`cookies()` → `store.get(DEVELOPMENT_SESSION_COOKIE)?.value` →
`requireServerPermission(...)`). No route was changed.

## 6. Financial representation

Money remains integer minor units end-to-end (`lib/utils/commercial-math.ts`);
Prisma uses `Decimal(p, s)` columns. No float arithmetic anywhere; the export /
import layer treats amounts as opaque domain values.

## 7. Tests (run with `npx tsx scripts/<file>.ts`)

| Script | Coverage | Result |
| --- | --- | --- |
| `test-workspace-repository.ts` | repository contract: seed, convergence, events, roundtrip, v1/v2 migration, unknown-field preservation, corrupt payload, SSR guard, registry swap | 29/29 |
| `test-workspace-transfer.ts` | export envelope, validation accept/reject matrix, replace/merge semantics, id & timestamp preservation, append-only activities, permissions, `WorkspaceImportError` | 30/30 |
| `test-financial-representation.ts` | minor-unit conversion incl. `0.1+0.2`, currency sums, deal value/commission rounding | 14/14 |
| `test-server-authorization.ts` | session resolution + Phase 5 permission matrix server-side | 11/11 |
| `test-matching.ts` (existing) | matching regression | pass |

## 8. Route regression (dev server :3000)

- Anonymous: `/`, `/suppliers`, `/requirements`, `/matching`, `/outreach`,
  `/follow-ups`, `/deals`, `/documents`, `/shipments`, `/reports`, `/settings`
  → **307** to `/login?returnTo=…`; `/login` → 200.
- With `minerallink-dev-session=dev-admin`: all 11 protected routes → **200**;
  `/login` → 307 (already authenticated).
- `/api/auth/session` → 200 (anonymous and authenticated).

## 9. Quality gates

- `npm run lint` → 0
- `npx tsc --noEmit` → 0
- `npm run build` → 0 (17 pages + proxy)
- `npx prisma validate` → 0; `npx prisma generate` → 0
- `prisma migrate diff` → 0 (offline, schema→schema only)

## 10. Explicitly out of scope / activation checklist

Not done on purpose: no DB connection at runtime, no `migrate deploy`/`db
push`/`db seed`, no route rewrite to server writes, no export/import UI, no
auth changes, no changes to storage keys, permissions, or money math.

To activate server persistence later:
1. Apply pending migrations against the target database (with backups).
2. Implement a `WorkspaceRepository` with `backend: "server-api"` over the
   Prisma models above (map ISO strings ↔ `DateTime`, keep money as `Decimal`).
3. `setWorkspaceRepository(new ServerWorkspaceRepository(...))` behind an env
   flag; keep the browser adapter as the fallback.
4. Guard writes with `requireServerPermission(...)` in route handlers.
5. Keep export/import as the migration path for existing browser workspaces.

