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
| **Edge Function** | `recoverMissingBookings/index.ts` | ✅ Live (Phase 2.1 & 2.2). Drains Channex archive for missing bookings older than 30 min, applies via `applyRevision`, marks resolved, and writes to `sync_logs`. |
| **Page** | `bookings/ui/BookingsPage.jsx` | ✅ Notification-driven `ModifiedBookingDetailsModal` (Phase 3.2). ✅ OTA filter UI. ✅ TapeChart + AddBookingModal. ❌ OTA filter is client-side `.filter()` (Phase 3.4). ❌ No `SyncHealthBanner` (Phase 3.3). |
| **Superadmin** | `logs/components/RecoverBookingsModal.jsx` | ✅ Live (Phase 4.1). Manual recovery trigger modal with dry-run support calling `recoverMissingBookings`. |

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

**Status:** ✅ **Implemented & Deployed**

### 2.1 — Edge Function: `recoverMissingBookings`

This function is **one-shot** (triggered manually by the superadmin, never on a cron).
It is NOT run periodically — that would re-pull the same bookings endlessly.

**Trigger:** Superadmin notices a gap in bookings or triggers recovery from the Superadmin Sync Logs modal.

**Steps:**
1. **Identify missing revisions** — query `revision_failures` where `resolved = false`
   and `first_failed_at < now() - 30 minutes` (or custom `from_ts`).
2. **Call `GET /bookings`** on Channex, filtered by `inserted_at[gte]` = earliest
   `first_failed_at` timestamp.
3. **Find missing bookings** — match by `channex_booking_id`. Any booking returned by
   Channex that is absent from Supabase `bookings` is missing.
4. **Save to database** — use the same `applyRevision` upsert logic (idempotent insert).
5. **Mark recovered** — update `revision_failures` rows to `resolved = true`.

**Location:** [`supabase/functions/recoverMissingBookings/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/recoverMissingBookings/index.ts) ✅

---

### 2.2 — `sync_logs` entries for all recovery attempts

Every recovery attempt (success or failure) is written to `sync_logs` per the
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
✅ Implemented in `recoverMissingBookings/index.ts`.

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

### 3.2 — Modified booking details modal (Notification-triggered)

When an OTA modifies an existing booking, an in-app notification is inserted (`type: "booking_modified"`). Clicking the notification from the header dropdown opens the `ModifiedBookingDetailsModal` directly on the Bookings page.

Per the Channex integration standard:
> *"modified → safest default is log + ack + notify a human, because blindly applying OTA modifications (date/room/price changes) to a live calendar needs reconciliation UX the PMS probably doesn't have yet. Say so to the user instead of silently auto-applying."*

The purpose of this modal is pure **informational transparency**: when an OTA updates a booking, the property owner is notified and can clearly see what changed (new dates, updated room rates, guest notes) so they are never surprised by automatic calendar shifts.

**Component:** `ModifiedBookingDetailsModal`
- Triggered seamlessly when the owner clicks a `"booking_modified"` notification in `NotificationBell`.
- Displays the modification summary (extracted from `booking.notes` populated by `buildModificationNote()`, stay dates, amount, and guest details).
- Provides a simple **"Close"** button to dismiss the view (no backend mutation or edge function required).

**Files created:**
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

## Phase 4 — Superadmin: Recovery Trigger Modal

> Superadmin needs a way to trigger `recoverMissingBookings` without SSH access.

**Status:** ✅ **Implemented** in `src/features/superadmin/logs/`

### 4.1 — Recovery modal (`RecoverBookingsModal`)

Implemented in Superadmin Sync Logs (`src/features/superadmin/logs/`):
- **Modal:** [`RecoverBookingsModal.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/superadmin/logs/components/RecoverBookingsModal.jsx)
- **Hook:** [`useRecoverBookings.js`](file:///c:/Users/SEJI/YadoSync/src/features/superadmin/logs/hooks/useRecoverBookings.js)
- **API:** [`recoveryApi.js`](file:///c:/Users/SEJI/YadoSync/src/features/superadmin/logs/supabase/recoveryApi.js)
- Automatically resolves the earliest unresolved failure timestamp from `revision_failures` as the starting window.
- Allows live recovery and optional dry-run preview before executing.
- Calls `supabase.functions.invoke("recoverMissingBookings", { body: { startingFrom, dryRun } })` and writes to `sync_logs`.

---

## Planned separately — Booking tape chart data model

> **Planning only.** Phases 3.3 (sync health banner) and 3.4 (server-side OTA filter)
> remain deferred. This section describes the calendar under `BookingsPage`; it does
> not implement either deferred phase.

### Decision: keep the pictured hierarchy with virtual room slots

The screenshot's **Ocean Villa** and **Ocean Villa 1/2/3** are mock labels. The same
*visual structure* can be used with real data: group by room type, then show one
numbered **display slot** per unit of that type. Channex sells inventory as
`room_type_id` plus `count_of_rooms` and returns booking `rooms[]` entries with
`room_type_id`, `rate_plan_id`, and stay dates. `GET /bookings` alone gives the
bookings, not the room-type title or unit count. Read those from local `room_types`
(populated from Channex), then place each booked-room entry into a free display slot.
Rate plans describe price and selling rules for a room type. Several plans can sell
the *same* rooms, so one calendar row per rate plan would repeat the inventory.

**Target hierarchy:**

```text
Selected property: Ocean Villa Resort
  Ocean Villa                 3 units total
    Slot 1                    booking bars
    Slot 2                    booking bars
    Slot 3                    booking bars
  Standard Room               4 units total
    Slot 1 ... Slot 4         booking bars
  Unmapped booking rooms      attention needed; never assign these to a default type
```

If the owner selects **All properties**, add a property heading above each room type.
With one selected property, show room types directly. Child slots preserve the
pictured layout, but they are **visual positions, not named doors or assigned rooms**.
Use labels such as "Slot 1" (or "Ocean Villa · Slot 1") until actual physical units
exist. Show the booked rate plan in a bar's details or tooltip, alongside the OTA and
reservation code; it is not a row key. A one-unit type needs one child slot.

**Observed staging sample (GET `/api/v1/bookings/`):** The supplied response contains
two Booking.com reservations for the same property, room type, and rate plan. Each
has one booked-room entry. One stays Sep 10–11, 2026; the next stays Sep 11–15, 2026,
so checkout and check-in can share a date without overlapping nights. Both room
entries include `booking_room_id`, `ota_unique_id`, and `is_cancelled: false`, but
neither has a physical unit assignment. `booking_room_id` appears to identify a
booking-room entry; its stability across revisions needs verification, and it is not
a named villa. The booking response does not give `count_of_rooms`; load that from
`room_types`. This sample supports room-type grouping and virtual slots, while a
multi-room reservation and modification still need separate fixture checks. The
Booking List is the latest booking snapshot; the revision feed remains the source
for incremental ingestion.

**Real physical unit rows are a later, explicit product choice.** If owners need to assign
guests to named doors ("Ocean Villa 1"), add a local `room_units` model and an
assignment per booking-room entry, with overlap validation and an **Unassigned** lane.
Channex will still receive availability at room-type level. Never infer a unit from
the order of `rooms[]`, a rate plan, or a placeholder `room_id`.

### Why the current chart cannot show real placements yet

- `TapeChart/tapeChartData.js` supplies the pictured categories, units, and bookings.
  `TapeChart.jsx` keeps those demo bookings even when real data arrives, defaults its
  date to March 25, 2026, and maps a real booking with no `room_id` to mock `r1`.
- `TapeChart.jsx` puts `bookings.room_type_id` into `categoryId`, but the demo category
  IDs are strings like `cat-ocean-villa`; a real UUID cannot match them. The ingest
  path currently does not populate the top-level `bookings.room_type_id` anyway.
- `applyRevision.ts` writes the full `rooms[]` array to `booked_rooms` for new and
  recovery bookings. The checked-in bookings migration does not define that column,
  and `getBookings()` does not select it. Confirm the deployed schema and add a
  migration if the column exists only as a dashboard change.
- `_shared/types.ts` does not yet type the observed `booking_room_id`,
  `ota_unique_id`, or `is_cancelled` room fields. Include them in the booking-room
  contract when the projection is implemented.
- One Channex reservation can contain multiple booked rooms, even across room types
  or dates. A single booking bar derived from top-level `check_in`/`check_out` cannot
  represent those entries accurately. `AddBookingModal` is also currently a demo form,
  not a persisted booking or block workflow.

### Data contract for the calendar

1. Load the owner's properties and their room types (`id`, `property_id`,
   `channex_room_type_id`, `title`, `count_of_rooms`). Load only bookings whose stay
   intersects the visible date window and selected property, including `booked_rooms`.
   Load the same window from `availability` for the sellable count. Keep all reads
   behind RLS; the frontend reads Supabase, never Channex.
2. Project each `booked_rooms[]` element into a **booking-room entry** carrying its
   parent booking ID, `booking_room_id` when present, Channex room-type ID, Channex
   rate-plan ID, `checkin_date`, `checkout_date`, `is_cancelled`, parent status, OTA,
   and guest. Map Channex IDs to local room types and rate plans. Retain multiple
   entries for the same reservation.
3. For durable assignments and robust modification reconciliation, normalize those
   entries into a `booking_rooms` table later. Prefer `booking_room_id` as the source
   entry identifier when present, but verify its continuity across modifications
   before relying on it as a unique key. `ota_unique_id` is an OTA-side identifier,
   not a local physical unit assignment; it is optional across channels. Define a
   local entry ID and explicit revision reconciliation for missing or changed source
   IDs rather than assuming an array index is stable.
4. Render `count_of_rooms` virtual child slots under each room type. Assign each
   active booking-room entry to a non-overlapping slot using its stay interval;
   adjacent checkout/check-in dates may reuse one slot. Do this across all bookings
   for the visible window **before** OTA/status display filtering, so filters do not
   reshuffle bars. Slot numbers can still change when the queried window changes;
   never present them as durable room assignments. When collapsed, show an occupancy
   summary instead of overlapping bars on the heading. Show daily booked counts
   from booking-room entries and sellable availability from the `availability` table:
   blocks or manual overrides can make `count_of_rooms - booked` differ from sellable
   availability. If active overlaps exceed `count_of_rooms`, add a clearly marked
   overbooked lane; never hide a booking. Flag discrepancies and missing mappings.
   The checkout date is exclusive.
5. Cancelled bookings and individual entries with `is_cancelled: true` do not occupy
   nights. For a modified booking, continue to show
   the last applied calendar placement with a review marker until changes are
   reconciled; show the proposed dates/room/rate in the review details. Do not
   silently move a bar from a raw revision payload. Keep booking lifecycle status
   separate from review state when this workflow is implemented.

### Implementation sequence and acceptance checks

1. Verify the deployed `booked_rooms` schema and commit its migration. Verify
   `room_types.channex_room_type_id` is populated and identify how unmapped OTA
   room entries should be reviewed.
2. Add focused Supabase queries and TanStack keys/hooks for properties, room types,
   and bookings intersecting the visible window. Keep mapping and lane calculations
   in pure feature utilities, with no Channex calls from React.
3. Replace `ROOM_CATEGORIES`, `INITIAL_BOOKINGS`, the `r1` fallback, and the fixed
   screenshot date with data-derived rows and the current date. Render useful empty,
   loading, and error states. Make property selection and visible-window navigation
   drive the query.
4. Show one bar per booked-room entry on a virtual child slot, link related bars to
   the same reservation details, and place unknown room types in an explicit
   **Unmapped** section. Keep rate plan as booking metadata.
5. Check: a one-room booking; two simultaneous rooms of one type; a reservation
   spanning two types; overlapping reservations; a cancelled booking; a pending
   modification; a partially cancelled reservation; adjacent checkout/check-in on
   the same date; an unmapped room type; and a stay crossing the visible-window edge.
   Compare daily occupied counts with stored availability before treating the
   calendar as a trustworthy operations view.

**Channex references:** [Booking revisions and booking-room fields](https://docs.channex.io/api-v.1-documentation/bookings-collection), [room types and `count_of_rooms`](https://docs.channex.io/api-v.1-documentation/room-types-collection), [rate plans](https://docs.channex.io/api-v.1-documentation/rate-plans-collection).

---

## Implementation Order

```
✅ Phase 1.1  DB migration: revision_failures table
✅ Phase 1.2  _shared/bookings.ts: ApplyResult kind classification
✅ Phase 1.3  pollBookingFeed: retry loop + failure recording
✅ Phase 1.4  pollBookingFeed: mark resolved on success
✅ Phase 2.1  Edge function: recoverMissingBookings
✅ Phase 2.2  sync_logs entries for recovery
✅ Phase 3.1  useBookings: realtime subscription
✅ Phase 3.2  ModifiedBookingDetailsModal component
Phase 3.3  SyncHealthBanner component
Phase 3.4  OTA filter: server-side via hook params
✅ Phase 4.1  Superadmin: RecoverBookingsModal (in logs)
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
