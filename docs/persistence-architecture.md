# Persistence Architecture (Phase 6 → Phase 7)

Status: **server persistence implemented behind a controlled boundary, not yet
activated.** Phase 7 added the Prisma/PostgreSQL repository, HTTP command
routes, and an idempotent import tool — all behind the persistence-mode switch.
The application still runs on the browser workspace by default
(`persistenceMode: "browser"`, `databaseActivated: false`,
`migrationApplied: false`). No database command (`migrate`, `db push`,
`seed`) was executed, and `prisma.config.ts` / credentials were not modified.

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
    └── server-workspace-client     ← reserved adapter (Phase 7, browser-safe
         fetch → /api/workspace/*    no Prisma import; not wired into UI yet)
         uses lib/data/workspace-model.ts (pure aggregate, seed, normalization)

server side (Phase 7, implemented — reachable only via HTTP routes):
lib/repositories/prisma-*-operations.ts   ← server-only Prisma operations
    │  inject PrismaClient
    ▼
lib/generated/prisma (PostgreSQL schema, migration not applied)
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

## 7. Phase 7 — server repository boundary (implemented, gated)

Phase 7 activated the Prisma architecture behind a server repository boundary.
Nothing in the browser changed: components still import
`lib/data/supplier-workspace.ts`, which still reads/writes localStorage through
the browser repository. The server path exists but is only reachable through
HTTP routes.

**Server operation modules** (`lib/repositories/`, server-only — never import
from client components):

| Module | Responsibility |
| --- | --- |
| `prisma-workspace-repository.ts` | shared contract types only (`ServerActor`, `SupplierAggregate`, `DealAggregate`) |
| `prisma-workspace-repository-concurrency.ts` | shared `newId()` / `checkConcurrency()` helpers |
| `prisma-supplier-operations.ts` | supplier aggregate read, create/update, verification, activities |
| `prisma-crm-operations.ts` | buyer/requirement CRM records |
| `prisma-communication-operations.ts` | communications, follow-ups, information requests |
| `prisma-deal-operations.ts` | deal aggregate read, create, stage transition |
| `prisma-deal-commercial-operations.ts` | commercial terms, negotiations, introduction |
| `prisma-deal-logistics-operations.ts` | shipments, inspections, payment milestones |
| `prisma-product-operations.ts` | products + assays |
| `prisma-document-operations.ts` | document records (metadata-only storage state) |

Key behaviours:

- **Optimistic concurrency** — important transitions accept
  `expectedUpdatedAt`; a mismatch throws a `CONFLICT` `PersistenceError`
  (no silent lost update).
- **Append-only audit** — every mutation writes an activity row with
  `actorUserId` / `actorName` inside the same `db.$transaction`.
- **Error mapping** — Prisma errors become typed `PersistenceError`s
  (P2002 → CONFLICT, P2025 → NOT_FOUND, timeout → DATABASE_UNAVAILABLE,
  unknown errors redacted); no internals leak to clients.
- **Decimal safety** — mapper row types carry exact decimal *strings*
  (`string | null`), which Prisma accepts natively for `Decimal` columns.
  Domain money math stays integer minor units; no float arithmetic and no
  lossy `Number` conversion at the Prisma boundary. Read signatures widen the
  same rows' Decimal columns to `DecimalLike` (`WithDecimalCols`) so Prisma's
  runtime `Decimal` values (exact `toString()`) flow into the pure mappers
  without boundary casts.

**HTTP boundary** (`app/api/workspace/*`, all dynamic routes in the build):

| Route | Method role | Auth |
| --- | --- | --- |
| `/api/workspace/status` | persistence mode + activation flags (default: browser, `databaseActivated: false`, `migrationApplied: false`) | session |
| `/api/workspace/suppliers/commands` | dispatches `supplier.*` command strings to supplier operations | per-command Phase 5 permission (e.g. `supplier.create`) |
| `/api/workspace/deals/commands` | dispatches `deal.*` command strings | per-command Phase 5 permission (e.g. `deal.stage` → `deal.stage.manage`) |
| `/api/workspace/import` | `preview` (dry-run) / `apply` modes | preview: `settings.read`; apply: `user.manage` |

All routes follow the same pattern: `requireServerPermission(cookie, permission)`
from `lib/auth/server-authorization.ts` (Phase 5 matrix, dev session cookie),
then dispatch on the `command` field via `server-route-helpers.ts`. Browser
fallback is untouched — a failed/unreachable server never breaks the UI.

**Client adapter** — `lib/repositories/server-workspace-client.ts` is
browser-safe (fetch only, no Prisma import) and reserved for wiring
`backend: "server-api"` later; no component uses it yet.

**Import tooling** (migration path for existing browser workspaces):

- `server-import.ts` — pure preview/dry-run: counts, validation errors, and a
  conflict report; performs no writes.
- `server-import-apply.ts` — applies suppliers + evidence;
  `server-import-apply-deals.ts` — applies CRM + deals. Both are **idempotent**:
  stable browser ids are reused as Prisma ids; same-content re-import updates
  in place; content conflicts (supplier `companyName`, deal `status`) keep the
  server version and are reported, never overwritten.

**Activation gate** — integration tests are opt-in
(`PHASE7_RUN_DB_TESTS=1`) and skip gracefully when the DB is unreachable; they
only create rows with a `phase7-` id prefix and delete exactly those ids in
`finally`.

## 8. Tests (run with `npx tsx scripts/<file>.ts`)

| Script | Coverage | Result |
| --- | --- | --- |
| `test-workspace-repository.ts` | repository contract: seed, convergence, events, roundtrip, v1/v2 migration, unknown-field preservation, corrupt payload, SSR guard, registry swap | 29/29 |
| `test-workspace-transfer.ts` | export envelope, validation accept/reject matrix, replace/merge semantics, id & timestamp preservation, append-only activities, permissions, `WorkspaceImportError` | 30/30 |
| `test-financial-representation.ts` | minor-unit conversion incl. `0.1+0.2`, currency sums, deal value/commission rounding | 14/14 |
| `test-server-authorization.ts` | session resolution + Phase 5 permission matrix server-side | 11/11 |
| `test-matching.ts` (existing) | matching regression | pass |
| `test-phase7-persistence.ts` | Phase 7 suite (runner): decimal round-trip, supplier/product/assay mapping, error mapping, persistence mode, documents/CRM/deals/finance, match snapshot, server validation, import preview, Phase 5 auth matrix | 44/44 |
| `test-phase7-integration.ts` | DB integration (opt-in `PHASE7_RUN_DB_TESTS=1`): synthetic `phase7-` rows only, exact-id cleanup in `finally`; skips when DB unreachable | skip (default) |

## 9. Route regression (dev server :3000)

- Anonymous: `/`, `/suppliers`, `/requirements`, `/matching`, `/outreach`,
  `/follow-ups`, `/deals`, `/documents`, `/shipments`, `/reports`, `/settings`
  → **307** to `/login?returnTo=…`; `/login` → 200.
- With `minerallink-dev-session=dev-admin`: all 11 protected routes → **200**;
  `/login` → 307 (already authenticated).
- `/api/auth/session` → 200 (anonymous and authenticated).

## 10. Quality gates

- `npm run lint` → 0 (0 warnings, 0 errors, 181 files)
- `npx tsc --noEmit` → 0
- `npm run build` → 0 (17 pages + proxy + 4 workspace API routes)
- `npx prisma validate` → 0; `npx prisma generate` → 0
- `prisma migrate diff` → 0 (offline, schema→schema only)
- Phase 7 tests: `test-phase7-persistence` 44/44 (mapping + domain + auth +
  import preview), integration suite skips without `PHASE7_RUN_DB_TESTS=1`

## 11. Explicitly out of scope / activation checklist

Not done on purpose: **migration not applied** (no `migrate deploy` /
`db push` / `db seed`), no route rewrite to server writes (UI still uses
localStorage), **deal-lifecycle integration steps deferred pending the
migration**, no export/import UI, no auth changes, no changes to storage keys,
permissions, or money math.

Done in Phase 7: server operation modules, HTTP command routes with Phase 5
permissions, import preview/apply tooling, browser-safe client adapter,
Phase 7 test suites.

To activate server persistence later:
1. Apply pending migrations against the target database (with backups).
2. Wire `server-workspace-client.ts` as `setWorkspaceRepository(...)` behind an
   env flag; keep the browser adapter as the fallback.
3. Run `PHASE7_RUN_DB_TESTS=1 npx tsx scripts/test-phase7-integration.ts`
   against the migrated database.
4. Complete the deferred deal-lifecycle integration steps.
5. Keep export/import as the migration path for existing browser workspaces.

