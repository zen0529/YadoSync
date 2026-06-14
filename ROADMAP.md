# YadoSync — What to Build Next

## Where You Are Now ✅

| Done | Feature |
|---|---|
| ✅ | Superadmin: Create / Update / View All Properties (Channex + Supabase dual-write) |
| ✅ | Property owner account auto-created on property creation |
| ✅ | Property owner can log in |
| ✅ | Connections page (OTA platform connect/disconnect UI — shell only) |
| ✅ | Inventory page shell (UI exists, wired to real Supabase data) |
| ✅ | Channex as backbone (property API fully done, photos, address, groups) |
| ✅ | **Phase 1: Room Types** — full CRUD via Channex + Supabase, property owner can create/edit/delete |
| ✅ | **Phase 2: Rate Plans** — full CRUD via Channex + Supabase, nested under room types in the Owner Dashboard |

> **Note (fixed):** `useCreateRatePlan` was invoking `"create-rate-plan"` (hyphenated) instead of `"createRatePlan"` — corrected to match the actual edge function folder name.

---

## Channex Data Model (dependency chain)

```
Property → Room Types → Rate Plans → ARI (Availability + Rates) → OTA Channels → Bookings
```

Each layer is required before the next is meaningful. Phases 1 & 2 completed the first three levels. The property is fully configured in Channex but **not yet bookable** — no availability or prices have been pushed.

---

## 📍 Where We Are: **Phase 3 (ARI Push)**

Room types and rate plans exist in Channex but:
- Every room shows **0 availability** (Channex default on creation)
- No rate is set on any date — guests see nothing bookable on any OTA
- The Inventory page has no real calendar/pricing editor yet

Phase 3 makes the property actually visible and bookable on OTAs.

---

## The Roadmap

### ✅ Phase 1 — Room Types (COMPLETED)

Property owner can create, edit, and delete room types from the Inventory page. Each mutation goes to Channex first, then mirrors to Supabase (`room_types` table). Rollback on Supabase failure.

**Channex API used:** `POST /room_types`, `PUT /room_types/:id`, `DELETE /room_types/:id`

---

### ✅ Phase 2 — Rate Plans (COMPLETED)

Rate plans are nested under room types in the Inventory page. Property owner can add, edit, and delete rate plans per room type. Same dual-write pattern with rollback.

**Channex API used:** `POST /rate_plans`, `PUT /rate_plans/:id`, `DELETE /rate_plans/:id`

---

### 📍 Phase 3 — ARI Push (Availability + Rates) — CURRENT FOCUS

> **Goal: Make the property bookable on OTAs.**

Without an ARI push, everything built in Phases 1 & 2 is invisible to OTAs. Channex sets room type availability to 0 on creation and sets no prices on rate plans.

**Two Channex endpoints, always sent as separate messages:**
- `POST /availability` — per room type, sets how many rooms are available per date
- `POST /restrictions` — per rate plan, sets rate + min_stay + stop_sell etc.

**Rules (from the `channex-pms-integration` skill):**

| Rule | Detail |
|---|---|
| **Compress ranges** | Run-length encode consecutive equal values into `date_from`/`date_to` entries |
| **Push deltas, not the world** | On creation: push initial values. On edit: push only what changed and only changed fields (Channex applies partial restriction updates) |
| **Debounce** | Coalesce rapid edits into one push via a job queue |
| **Never send past dates** | Filter `date >= today` before every push |
| **Verify with a readback** | `GET /availability` and `GET /restrictions?...&filter[restrictions]=rate` — do not trust the 200 alone |

**What to build:**

1. **Initial availability push** — when a room type is created, immediately push `count_of_rooms` for the next 365 days
2. **Initial restriction push** — when a rate plan is created, push a default rate (e.g. 0 or a configured base rate) for the next 365 days
3. **Inventory / Rates editing UI** — a calendar or date-range editor on the Inventory page where property owners set per-date prices and availability
4. **On-save push** — every save in the editor triggers an ARI delta push (only changed dates, only changed fields)
5. **Periodic full push** — hourly drift-correction job (e.g. Supabase cron) to re-sync everything, so no missed event can permanently desync

**Supabase tables to add (or extend):**

```sql
-- Store per-date availability (source of truth for UI + push source)
CREATE TABLE availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE,
  date date NOT NULL,
  available integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (room_type_id, date)
);

-- Store per-date restrictions (source of truth for UI + push source)
CREATE TABLE restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  rate_plan_id uuid REFERENCES rate_plans(id) ON DELETE CASCADE,
  date date NOT NULL,
  rate integer NOT NULL DEFAULT 0,        -- in MINOR units (cents)
  min_stay_arrival integer DEFAULT 1,
  stop_sell boolean DEFAULT false,
  closed_to_arrival boolean DEFAULT false,
  closed_to_departure boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (rate_plan_id, date)
);
```

> **Money units:** Channex expects rates as integers in **minor units (cents)** on writes. Rates come back as decimal strings ("138.00") on reads. Convert at the API boundary only.

---

### Phase 4 — Inbound Bookings (OTA → YadoSync)

> **Goal: OTA bookings automatically appear in YadoSync.**

Channex delivers OTA bookings as **revisions** with a 30-minute expiry window. The robust setup uses both:

- **Feed poller** (start here): `GET /booking_revisions/feed` every minute → apply → `POST /booking_revisions/:id/ack`
- **Webhook endpoint**: `POST /webhooks` to register a callback → on event, pull revision by id → apply → ack

**Key rules:**
- Ack **only after** successfully writing the booking to Supabase — if writing fails, leave un-acked so it retries
- Drain the feed until empty on each poll (don't stop at page 1 if `meta.total > meta.limit`)
- Dedupe by `channex_booking_id` (look up in mapping before inserting)
- Never drop an OTA booking — if overbooked, flag it; don't reject
- `modified` revisions: flag for manual review, don't auto-apply (see skill for reasoning)
- Recovery after outage: one-shot `GET /bookings?filter[inserted_at][gte]=<outage_start>` — not a periodic sweep

**What to build:**
1. `bookings` Supabase table (with `channex_booking_id`, `ota_name`, `ota_reservation_code`, status, guest info, dates, amount)
2. `pollBookingFeed` Supabase edge function (scheduled every minute)
3. `channex-webhook` Supabase edge function (HTTP endpoint, registered with Channex)
4. Booking apply logic: new / cancelled / modified handling
5. Property owner Bookings page wired to real data

---

### Phase 5 — OTA Channel Connections (Make Connections page functional)

> **Goal: Property owner connects their Booking.com / Airbnb / etc. account through Channex.**

The Connections page UI exists but is a stub. This phase wires it to the Channex Channel API (requires **Channel API access** on the Channex account).

**Flow:**
1. `POST /channels/test_connection` — test OTA credentials (hotel_id)
2. `POST /channels/mapping_details` — read OTA's rooms and rate codes
3. Map OTA room+rate codes to YadoSync rate plans
4. `POST /channels` — create the channel with the mapping
5. `POST /channels/:id/activate` — go live

**Critical traps (from skill):**
- Room/rate codes from OTAs come back as **integers** — send them as integers, not strings
- `group_id` is required — fetch `GET /groups` and use the group that owns the property
- Channels are created **inactive** — must explicitly activate
- Delete requires deactivation first

---

### Phase 6 — Dashboard & Analytics

With real bookings data, the Dashboard and Analytics pages become meaningful:
- Revenue metrics (total, by OTA, by room type)
- Occupancy rate per date range
- Commission tracking
- Platform breakdown chart

---

## Summary Table

| Phase | Feature | Who | Unblocks | Status |
|---|---|---|---|---|
| **1** | Room Types | Superadmin + Property Owner | Rate Plans | ✅ Done |
| **2** | Rate Plans | Superadmin + Property Owner | ARI Push | ✅ Done |
| **3** | ARI Push (Availability + Rates) | Property Owner manages dates/prices | Bookings can flow | 📍 **Current** |
| **4** | Inbound Bookings (feed + webhook) | Automated + Owner views | Revenue data | ⏳ Pending |
| **5** | OTA Channel Connections | Property Owner maps OTA rooms | OTA sync live | ⏳ Pending |
| **6** | Dashboard + Analytics | Owner views | Business insights | ⏳ Pending |

---

## Supabase Edge Functions (current)

| Function | Purpose |
|---|---|
| `createProperty` | Auth user + Channex property + Supabase row + email |
| `updateProperty` | Channex PUT + Supabase update + photo sync |
| `delete-property` | Channex DELETE + Supabase delete |
| `createRoomType` | Channex POST + Supabase insert + rollback |
| `updateRoomType` | Channex PUT + Supabase update |
| `deleteRoomType` | Channex DELETE + Supabase delete |
| `createRatePlan` | Channex POST + Supabase insert + rollback |
| `updateRatePlan` | Channex PUT + Supabase update |
| `deleteRatePlan` | Channex DELETE + Supabase delete |

**To add in Phase 3:**
- `pushAvailability` — POST to Channex `/availability` with range compression
- `pushRestrictions` — POST to Channex `/restrictions` with delta + range compression

**To add in Phase 4:**
- `pollBookingFeed` — scheduled, polls feed, applies revisions, acks
- `channex-webhook` — HTTP endpoint, receives Channex booking events

---

## Environment Variables Required

| Variable | Where set | Notes |
|---|---|---|
| `CHANNEX_BASE_URL` | Supabase secrets | `https://staging.channex.io` (staging) or `https://app.channex.io` (prod) |
| `CHANNEX_API_KEY` | Supabase secrets | Never in source control |
| `SUPABASE_URL` | Auto-injected | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secrets | Used by admin-level edge functions |
| `SUPABASE_ANON_KEY` | Auto-injected | Used by user-scoped edge functions |
| `SMTP_HOST / SMTP_PORT / SMTP_USERNAME / SMTP_PASSWORD` | Supabase secrets | For owner welcome email |
