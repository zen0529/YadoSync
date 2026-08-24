# YadoSync — What to Build Next

## Where You Are Now ✅

| Done | Feature                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| ✅   | Superadmin: Create / Update / View All Properties (Channex + Supabase dual-write)                          |
| ✅   | Property owner account auto-created on property creation                                                   |
| ✅   | Property owner can log in                                                                                  |
| ✅   | Connections page (OTA platform connect/disconnect UI — shell only)                                         |
| ✅   | Inventory page shell (UI exists, wired to real Supabase data)                                              |
| ✅   | Channex as backbone (property API fully done, photos, address, groups)                                     |
| ✅   | **Phase 1: Room Types** — full CRUD via Channex + Supabase, property owner can create/edit/delete          |
| ✅   | **Phase 2: Rate Plans** — full CRUD via Channex + Supabase, nested under room types in the Owner Dashboard |
| ✅   | **Phase 3: ARI Push** — availability + rates editor UI, delta push to Channex, hourly pg_cron drift-correction |
| ✅   | **Phase 4: Inbound Bookings** — feed poller + webhook, bookings page wired to real data                    |
| ✅   | **Phase 5: OTA Channel Connections** — 3-step wizard (test → map → activate), deactivate-before-delete disconnect |

> **Note (fixed):** `useCreateRatePlan` was invoking `"create-rate-plan"` (hyphenated) instead of `"createRatePlan"` — corrected to match the actual edge function folder name.

---

## Channex Data Model (dependency chain)

```
Property → Room Types → Rate Plans → ARI (Availability + Rates) → OTA Channels → Bookings
```

Each layer is required before the next is meaningful. Phases 1, 2 & 3 completed the first four levels. The property is fully configured in Channex, availability and rates are being pushed, and the hourly cron keeps Channex in sync. **OTA bookings cannot yet flow back into YadoSync.**

---

## 📍 Where We Are: **Phase 6 (Dashboard & Analytics)**

All core OTA sync functionality is now complete. Properties can connect Booking.com (and other OTAs as they are onboarded) through a guided 3-step wizard, availability and rates push out automatically, and inbound bookings flow back in. Phase 6 turns the accumulated bookings data into actionable insights on the Dashboard.

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

### ✅ Phase 3 — ARI Push (Availability + Rates) — COMPLETED

> **Goal: Make the property bookable on OTAs.**

Without an ARI push, everything built in Phases 1 & 2 is invisible to OTAs. Channex sets room type availability to 0 on creation and sets no prices on rate plans.

**Two Channex endpoints, always sent as separate messages:**

- `POST /availability` — per room type, sets how many rooms are available per date
- `POST /restrictions` — per rate plan, sets rate + min_stay + stop_sell etc.

**Rules (from the `channex-pms-integration` skill):**

| Rule                           | Detail                                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Compress ranges**            | Run-length encode consecutive equal values into `date_from`/`date_to` entries                                                           |
| **Push deltas, not the world** | On creation: push initial values. On edit: push only what changed and only changed fields (Channex applies partial restriction updates) |
| **Debounce**                   | Coalesce rapid edits into one push via a job queue                                                                                      |
| **Never send past dates**      | Filter `date >= today` before every push                                                                                                |
| **Verify with a readback**     | `GET /availability` and `GET /restrictions?...&filter[restrictions]=rate` — do not trust the 200 alone                                  |

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

### ✅ Phase 4 — Inbound Bookings (OTA → YadoSync) — COMPLETED

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

### ✅ Phase 5 — OTA Channel Connections (Make Connections page functional) — COMPLETED

> **Goal: Property owner connects their Booking.com / Airbnb / etc. account through Channex.**

The Connections page now runs a 3-step wizard backed by the Channex Channel API:

1. `POST /channels/test_connection` — verify hotel_id credentials
2. `POST /channels/mapping_details` — fetch OTA room+rate codes (integers)
3. Map OTA rooms/rates → local rate plans in a visual table
4. `POST /channels` → `POST /channels/:id/activate` — create + go live
5. Disconnect: `POST /channels/:id/deactivate` then `DELETE /channels/:id`

**Key traps handled:**
- Room/rate codes are cast to integers server-side before sending to Channex
- `group_id` resolved automatically via `GET /groups`
- Deactivate-before-delete enforced in `disconnectChannel` edge function
- Supabase write failure after channel create triggers channel rollback (deactivate + delete)

**New edge functions:** `testChannelConnection`, `getChannelMappingDetails`, `createChannel`, `disconnectChannel`

**Migration:** `20260725_platform_connection_channex.sql` — adds `channex_channel_id`, `channex_group_id`, `ota_hotel_id`, `mapping_payload` columns

---

### Phase 6 — Dashboard & Analytics

With real bookings data, the Dashboard and Analytics pages become meaningful:

- Revenue metrics (total, by OTA, by room type)
- Occupancy rate per date range
- Commission tracking
- Platform breakdown chart

---

## Summary Table

| Phase | Feature                           | Who                                 | Unblocks          | Status         |
| ----- | --------------------------------- | ----------------------------------- | ----------------- | -------------- |
| **1** | Room Types                        | Superadmin + Property Owner         | Rate Plans        | ✅ Done        |
| **2** | Rate Plans                        | Superadmin + Property Owner         | ARI Push          | ✅ Done        |
| **3** | ARI Push (Availability + Rates)   | Property Owner manages dates/prices | Bookings can flow | ✅ Done        |
| **4** | Inbound Bookings (feed + webhook) | Automated + Owner views             | Revenue data      | ✅ Done        |
| **5** | OTA Channel Connections           | Property Owner maps OTA rooms       | OTA sync live     | ✅ Done        |
| **6** | Dashboard + Analytics             | Owner views                         | Business insights | 📍 **Current** |

---

## Supabase Edge Functions (current)

| Function                    | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `createProperty`            | Auth user + Channex property + Supabase row + email |
| `updateProperty`            | Channex PUT + Supabase update + photo sync          |
| `delete-property`           | Channex DELETE + Supabase delete                    |
| `createRoomType`            | Channex POST + Supabase insert + rollback           |
| `updateRoomType`            | Channex PUT + Supabase update                       |
| `deleteRoomType`            | Channex DELETE + Supabase delete                    |
| `createRatePlan`            | Channex POST + Supabase insert + rollback           |
| `updateRatePlan`            | Channex PUT + Supabase update                       |
| `deleteRatePlan`            | Channex DELETE + Supabase delete                    |
| `pushAvailability`          | POST to Channex `/availability` with range compression + Supabase upsert |
| `pushRestrictions`          | POST to Channex `/restrictions` with delta + range compression + Supabase upsert |
| `fullSyncARI`               | Full-property drift-correction push (triggered by pg_cron hourly + "Sync All" button) |
| `pollBookingFeed`           | Scheduled; polls feed, applies revisions, acks      |
| `channex-webhook`           | HTTP endpoint; receives Channex booking events      |
| `testChannelConnection`     | Step 1 — verify OTA hotel_id credentials            |
| `getChannelMappingDetails`  | Step 2 — fetch OTA room/rate codes + resolve group_id |
| `createChannel`             | Step 3 — create + activate channel, dual-write Supabase, rollback on failure |
| `disconnectChannel`         | Deactivate + delete Channex channel, clear Supabase row |

---

## Environment Variables Required

| Variable                                                | Where set        | Notes                                                                     |
| ------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `CHANNEX_BASE_URL`                                      | Supabase secrets | `https://staging.channex.io` (staging) or `https://app.channex.io` (prod) |
| `CHANNEX_API_KEY`                                       | Supabase secrets | Never in source control                                                   |
| `SUPABASE_URL`                                          | Auto-injected    | —                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`                             | Supabase secrets | Used by admin-level edge functions                                        |
| `SUPABASE_ANON_KEY`                                     | Auto-injected    | Used by user-scoped edge functions                                        |
| `SMTP_HOST / SMTP_PORT / SMTP_USERNAME / SMTP_PASSWORD` | Supabase secrets | For owner welcome email                                                   |
