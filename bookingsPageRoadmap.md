# BookingsPage — Revision Feed Roadmap

> **Scope:** This document maps out every gap between the current implementation and the target
> booking ingestion flow shown in the architecture diagram. It covers the backend
> (`pollBookingFeed`, `_shared/bookings.ts`), the `channex-webhook` function, and the
> `BookingsPage` frontend, in the order they need to be built.

---

## Current State Snapshot

> **Last updated: 2026-09-18**

| Layer | File / Location | Status |
|---|---|---|
| **pg_cron job** | Supabase Dashboard → Database → Cron Jobs | ✅ Live. Calls `pollBookingFeed` via `net.http_post` every 1 min with `{"source":"cron"}`. |
| **DB migration** | `migrations/20260916_revision_failures.sql` | ✅ `revision_failures` table + `upsert_revision_failure` RPC deployed. |
| **Edge Function** | `pollBookingFeed/index.ts` | ✅ Drains feed, apply → ack. ✅ Transient/permanent error routing. ✅ `upsertRevisionFailure` + `markRevisionResolved`. ✅ 30-min window expiry detection. ✅ Skip-and-ack for unknown property IDs. ❌ No `sync_logs` writes on permanent failure (Phase 2). |
| **Edge Function** | `channex-webhook/index.ts` | ⏸️ **Intentionally deferred** — polling every minute is the sole delivery mechanism for now. Webhooks would add low-latency push but are not needed while cron polling is sufficient. |
| **Shared util** | `_shared/bookingsPage/applyRevision.ts` | ✅ `new` → upsert + `commission_amount` = `SUM(rooms[].amount) × rate` + `updatePropertyCommission()` rollup. ✅ `cancellation` → `commission_amount = 0` + rollup. ✅ `modified` → commission **recalculated** from new room amounts (not zeroed, not stale) + rollup + flagged for human review. ✅ `ApplyResult` with `kind: ErrorKind`. |
| **Shared util** | `_shared/bookingsPage/classifyError.ts` | ✅ Full transient/permanent classification (HTTP, SQLSTATE, PGRST, TypeError). |
| **Shared util** | `_shared/bookings.ts` | ✅ `upsertRevisionFailure()` + `markRevisionResolved()` — failure tracking helpers. |
| **Hook** | `bookings/hooks/useBookings.js` | ✅ TanStack Query, `refetchInterval: 60s`. ✅ `otaName` + `propertyId` params supported. ✅ Realtime subscription on `bookings` (Phase 3.1). ❌ OTA filter still client-side in `BookingsPage.jsx` (Phase 3.4). |
| **Page** | `bookings/ui/BookingsPage.jsx` | ✅ `modified` banner + count. ✅ OTA filter UI. ✅ TapeChart + AddBookingModal. ❌ OTA filter is client-side `.filter()` (Phase 3.4). ❌ No `SyncHealthBanner` (Phase 3.3). |

### Cron Job (already live)

```sql
-- Runs every minute via pg_cron + pg_net
SELECT net.http_post(
  url     := 'https://jjuukcyauernljhudnyo.supabase.co/functions/v1/pollBookingFeed',
  body    := '{"source":"cron"}'::jsonb,
  headers := jsonb_build_object(
    'Content-Type',  'application/json',
    'Authorization', 'Bearer <service_role_jwt>'
  )
);
```

> **Note:** `pg_net` is fire-and-forget — it does not surface errors back to the cron job.
> Failures are only visible in the `pollBookingFeed` function logs (Supabase Dashboard →
> Edge Functions → Logs). This reinforces the need for Phase 1 failure tracking so
> errors are persisted in the `revision_failures` table rather than silently dropped.

---

## Phase 1 — Backend: Transient Error Retry Loop

> **Goal:** Match the "When Save Fails with Transient Errors" panel in the diagram.
> When `applyRevision()` fails with a transient error, the revision must NOT be acked.
> Instead, the failure is recorded, and the revision will re-surface in the next
> poll cycle (every 1 minute). Retries continue up to the 30-minute expiry window.

### 1.1 — Add a `revision_failures` tracking table

Create a new Supabase migration to track failed apply attempts per revision:

```sql
create table revision_failures (
  id               uuid primary key default gen_random_uuid(),
  revision_id      text not null,
  booking_id       text,
  attempt_count    int  not null default 1,
  last_error       text,
  first_failed_at  timestamptz not null default now(),
  last_tried_at    timestamptz not null default now(),
  resolved         boolean not null default false,
  resolved_at      timestamptz
);

create unique index on revision_failures (revision_id) where resolved = false;
```

**Why:** This gives the poller a durable way to count retry attempts and detect when
the 30-minute window has passed. Without it, the poller has no memory between runs.

---

### 1.2 — Classify errors in `_shared/bookings.ts`

Extend `ApplyResult` to include an error category so callers can route transient vs
permanent failures differently.

```ts
// Before
export type ApplyResult = { ok: true } | { ok: false; reason: string };

// After
export type ErrorKind = "transient" | "permanent";

export type ApplyResult =
  | { ok: true }
  | { ok: false; reason: string; kind: ErrorKind };
```

**Transient errors** — retry within the 30-minute window:

| Error / condition | Detectable signal | What it means |
|---|---|---|
| **408 Request Timeout** | HTTP status `408` | Request took too long |
| **503 Service Unavailable** | HTTP status `503` | Supabase/PostgREST/database temporarily unavailable |
| **504 Gateway Timeout** | HTTP status `504` | Couldn't get a DB connection or complete in time |
| **Network failure** | `TypeError` with `"NetworkError"` or `"fetch"` in message | Connection between Deno and Supabase failed |
| **Connection timeout** | SQLSTATE `08006` / `08001` / `08000` | Couldn't establish or use DB connection in time |
| **Connection terminated unexpectedly** | SQLSTATE `08006` or `57P01` | Existing DB connection disappeared mid-query |
| **PGRST001** | `error.code === "PGRST001"` | PostgREST couldn't connect to database |
| **PGRST002** | `error.code === "PGRST002"` | PostgreSQL service/schema-cache connection problem |
| **PGRST003** | `error.code === "PGRST003"` | Couldn't obtain connection from pool before timeout |
| **DB resource exhaustion** | SQLSTATE `53300` (`too_many_connections`) | Pool temporarily can't handle another request |
| **FK violation `23503`** | SQLSTATE `23503` | `property_id` row may not exist *yet* — retry |
| **Schema cache miss `PGRST204`** | `error.code === "PGRST204"` | PostgREST cache stale after migration; reloads in ~5 min |

**Permanent errors** — alert immediately, do not retry:
- `23502` not-null violation — a required column is missing from the revision payload
- `22P02` invalid type/UUID — data shape mismatch, retrying will always fail
- `42703` undefined column — schema drift, needs a code or migration fix
- `PGRST301` / `PGRST302` — JWT auth failure on the service role key
- Any other `PGRST*` code not listed as transient above

#### `classifyError` helper (new function in `_shared/bookings.ts`)

```ts
const TRANSIENT_HTTP_STATUSES  = new Set([408, 503, 504]);
const TRANSIENT_SQLSTATE_CODES = new Set([
  "08000", "08001", "08006",  // connection errors
  "57P01",                    // admin shutdown / connection terminated
  "53300",                    // too_many_connections
  "23503",                    // foreign_key_violation (property may not exist yet)
]);
const TRANSIENT_PGRST_CODES = new Set(["PGRST001", "PGRST002", "PGRST003", "PGRST204"]);

export function classifyError(err: unknown): ErrorKind {
  // HTTP-level errors (e.g. from a fetch to the Supabase REST endpoint)
  if (typeof (err as any)?.status === "number") {
    if (TRANSIENT_HTTP_STATUSES.has((err as any).status)) return "transient";
  }
  // PostgrestError — classify by SQLSTATE or PGRST code
  const code: string | undefined = (err as any)?.code;
  if (code) {
    if (TRANSIENT_PGRST_CODES.has(code))  return "transient";
    if (TRANSIENT_SQLSTATE_CODES.has(code)) return "transient";
    if (code.startsWith("08") || code.startsWith("57")) return "transient";
    if (code.startsWith("PGRST")) return "permanent"; // all other PGRST = permanent
  }
  // Deno network errors — no code, just a TypeError
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (msg.includes("networkerror") || msg.includes("fetch")) return "transient";
  }
  // Default: transient so we retry at least once before alerting
  return "transient";
}
```

> **Note:** `retryBackoff.ts` already defines `RETRYABLE_STATUSES` (`429, 500–504`) for
> outbound **Channex** HTTP calls. The `classifyError` helper above is separate — it only
> classifies errors from the inbound **Supabase write** inside `applyRevision()`.

---

### 1.3 — Update `pollBookingFeed` retry logic

After `applyRevision()` returns `ok: false`:

1. **Record failure** — upsert into `revision_failures` (increment `attempt_count`,
   update `last_error`, `last_tried_at`).
2. **Check `first_failed_at`** — if `now - first_failed_at > 30 minutes`, the revision
   has likely fallen out of the feed. Log + alert.
3. **If transient and within 30 min** — leave un-acked, continue draining remaining
   revisions (never `break` on one failure).
4. **If permanent** — log loudly, write to `sync_logs`, alert the superadmin.

```ts
// Pseudocode addition inside the revision loop
if (!result.ok) {
  const failureRecord = await upsertRevisionFailure(supabase, revId, attr.booking_id, result.reason);

  const ageMs = Date.now() - new Date(failureRecord.first_failed_at).getTime();
  const isExpired = ageMs > 30 * 60 * 1000;

  if (result.kind === "permanent" || isExpired) {
    // Alert path — log to sync_logs, notify superadmin
    await writeSyncLog(supabase, { revisionId: revId, status: "failed_permanent", error: result.reason });
  }
  // Either way: do NOT ack — leave for re-surface or manual recovery
  failed++;
  errors.push(`Revision ${revId}: ${result.reason}`);
}
```

---

### 1.4 — Mark resolved on successful apply

When `applyRevision()` returns `ok: true`, check if a failure record exists for this
revision and mark it `resolved = true, resolved_at = now()`.

This closes the retry loop cleanly and keeps the failure table tidy.

---

## Phase 2 — Backend: Manual Backfill / Recovery

> **Goal:** Match the "After 30 Minutes — Manual Recovery / Backfill" panel.
> Once a revision falls out of the feed, the only recovery path is the
> Channex Booking List API.

### 2.1 — New Edge Function: `recoverMissingBookings`

This function is **one-shot** (triggered manually by the superadmin, never on a cron).
It should NOT be run periodically — that would re-pull the same bookings endlessly.

**Trigger:** Superadmin notices a gap in bookings or sees persistent failure records
in the `revision_failures` table.

**Steps:**
1. **Identify missing revisions** — query `revision_failures` where `resolved = false`
   and `first_failed_at < now() - 30 minutes`.
2. **Call `GET /bookings`** on Channex, filtered by `inserted_at[gte]` = earliest
   `first_failed_at` timestamp.
3. **Find missing bookings** — match by `channex_booking_id`. Any booking returned by
   Channex that is absent from Supabase `bookings` is missing.
4. **Save to database** — use the same `applyRevision` upsert logic (idempotent insert).
5. **Mark recovered** — update `revision_failures` rows to `resolved = true`.

```
supabase/functions/
└── recoverMissingBookings/
    └── index.ts
```

---

### 2.2 — `sync_logs` entries for all recovery attempts

Every recovery attempt (success or failure) must be written to `sync_logs` per the
project rule: *"Every sync attempt must be logged in `sync_logs` regardless of success
or failure."*

```ts
await supabase.from("sync_logs").insert({
  type: "booking_recovery",
  status: success ? "ok" : "failed",
  payload: { recovered: N, failed: M, revisionIds: [...] },
  created_at: new Date().toISOString(),
});
```

---

## Phase 3 — Frontend: BookingsPage UI

> **Goal:** Surface the revision feed state and `modified_pending` review flow
> directly in the `BookingsPage`.

### 3.1 — Realtime subscription alongside polling

The current `useBookings` hook polls every 60 seconds. Supplement with a Supabase
Realtime subscription so new bookings from the webhook path appear instantly.

**File:** `src/features/property-owner/bookings/hooks/useBookings.js`

```js
// Add inside useBookings — subscribe to INSERT and UPDATE on bookings table
useEffect(() => {
  const channel = supabase
    .channel("bookings-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

---

### 3.2 — Modified booking details modal

The alert banner in `BookingsPage` displays the count of bookings with `status === "modified"`.

Per the Channex integration standard:
> *"modified → safest default is log + ack + notify a human, because blindly applying OTA modifications (date/room/price changes) to a live calendar needs reconciliation UX the PMS probably doesn't have yet. Say so to the user instead of silently auto-applying."*

The purpose of this modal is pure **informational transparency**: when an OTA updates a booking, the property owner is notified and can clearly see what changed (new dates, updated room rates, guest notes) so they are never surprised by automatic calendar shifts.

**Add:** A `ModifiedBookingDetailsModal` component that:
- Displays all bookings currently with `status === "modified"`
- Shows the modification summary (extracted from `booking.notes` populated by `buildModificationNote()`, stay dates, amount, and guest details)
- Provides a simple **"Close"** button to dismiss the view (no backend mutation or edge function required)

**Files to create:**
```
src/features/property-owner/bookings/components/
└── ModifiedBookingDetailsModal/
    ├── index.js
    └── ModifiedBookingDetailsModal.jsx
```

---

### 3.3 — Sync health banner

Surface the `revision_failures` table data so the property owner sees when a booking
is stuck in a retry loop.

**Add to `BookingsPage`:** A `SyncHealthBanner` component (below the `modified_pending`
banner) that:
- Queries `revision_failures` where `resolved = false`
- If none → renders nothing
- If some → shows: *"X bookings couldn't sync. We're retrying automatically."*
- If any `first_failed_at > 25 minutes` → warning: *"A booking may need manual recovery.
  Contact support."*

**File:** `src/features/property-owner/bookings/components/SyncHealthBanner.jsx`

---

### 3.4 — OTA filter moved server-side

Currently the OTA filter is a **client-side** `.filter()` on already-fetched bookings.
For owners with large booking histories, move the filter **server-side** by passing
`otaName` into the `useBookings` hook so the query only fetches matching rows.

**Change in `BookingsPage.jsx`:**
```jsx
// Before
const { data: bookings = [] } = useBookings();
const filtered = bookings.filter(b => otaFilter === "all" || b.ota_name === otaFilter);

// After
const { data: bookings = [] } = useBookings({
  otaName: otaFilter === "all" ? undefined : otaFilter,
});
const filtered = bookings; // already filtered by the query
```

---

## Phase 4 — Superadmin: Recovery Trigger Panel

> Superadmin needs a way to trigger `recoverMissingBookings` without SSH access.

**File location:** `src/features/superadmin/bookings/`

### 4.1 — Recovery panel in `AdminBookingsPage`

Add a collapsible "Sync Recovery" panel that:
- Shows all unresolved `revision_failures` rows (revision ID, booking ID, attempt count,
  age, last error)
- Has a **"Trigger Recovery"** button — calls `supabase.functions.invoke("recoverMissingBookings")`
- Shows the result: how many bookings were recovered vs still failed

---

## Implementation Order

```
Phase 1.1  DB migration: revision_failures table
Phase 1.2  _shared/bookings.ts: ApplyResult kind classification
Phase 1.3  pollBookingFeed: retry loop + failure recording
Phase 1.4  pollBookingFeed: mark resolved on success
Phase 2.1  New edge function: recoverMissingBookings
Phase 2.2  sync_logs entries for recovery
✅ Phase 3.1  useBookings: realtime subscription
✅ Phase 3.2  ModifiedBookingDetailsModal component
Phase 3.3  SyncHealthBanner component
Phase 3.4  OTA filter: server-side via hook params
Phase 4.1  AdminBookingsPage: recovery trigger panel
```

---

## Key Principles (from Channex Integration Skill)

- **Never ACK a revision until it is successfully saved.**
- **Keep retrying transient errors within the 30-minute feed window.**
- **If a revision falls out of the feed, use the Booking List API to backfill.**
- **Continue draining other revisions even if one fails** — never `break` on error.
- **Use idempotency** (`channex_booking_id` upsert key) to prevent duplicate bookings.
- **Recovery is manual and time-scoped** — do NOT run it on a cron.
- **Every sync attempt (success or failure) must be logged** in `sync_logs`.
