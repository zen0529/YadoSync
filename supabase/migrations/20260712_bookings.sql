-- ============================================================
-- Phase 4: Inbound Bookings — bookings table
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. bookings table ─────────────────────────────────────────────────────────
-- One row per OTA booking. Upserted on channex_booking_id (dedup key).
-- Amount stored in major units (numeric 10,2) because Channex returns
-- booking amounts as decimal strings ("230.00"), not cents.

CREATE TABLE IF NOT EXISTS bookings (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           uuid        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Channex identifiers
  channex_booking_id    text        NOT NULL UNIQUE,   -- booking.id from Channex — dedup key
  channex_revision_id   text,                          -- most recent revision applied

  -- OTA metadata
  ota_name              text,                          -- "Booking.com", "Airbnb", etc.
  ota_reservation_code  text,                          -- OTA's own ref code (for staff)

  -- Booking status
  -- confirmed       → active booking
  -- cancelled       → OTA cancelled the booking
  -- modified_pending → modification received, needs human review
  status                text        NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('confirmed', 'cancelled', 'modified_pending')),

  -- Guest info
  guest_name            text,
  guest_email           text,
  guest_phone           text,

  -- Room info (FK nullable — room may not be mapped in Channex)
  room_type_id          uuid        REFERENCES room_types(id) ON DELETE SET NULL,

  -- Stay dates
  check_in              date        NOT NULL,
  check_out             date        NOT NULL,

  -- Financials — major units as returned by Channex ("230.00" → 230.00)
  amount                numeric(10,2),
  currency              text        DEFAULT 'USD',

  -- Full revision payload for audit / debugging
  raw_payload           jsonb,

  -- Notes — used for modified_pending: stores human-readable diff
  notes                 text,

  -- Timestamps
  booked_at             timestamptz,                   -- inserted_at from Channex revision
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bookings_property_id_idx       ON bookings (property_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx            ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_check_in_idx          ON bookings (check_in);
CREATE INDEX IF NOT EXISTS bookings_channex_booking_id_idx ON bookings (channex_booking_id);

-- ── 3. updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_bookings_updated_at();

-- ── 4. Row-Level Security ─────────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Property owners can read bookings for their own properties
CREATE POLICY "owners can view own bookings"
  ON bookings FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- Edge functions use the service role key which bypasses RLS — no INSERT/UPDATE
-- policies needed for server-side writes.

-- ── 5. pg_cron: pollBookingFeed every minute ──────────────────────────────────
-- Replace YOUR_SUPABASE_URL and YOUR_SERVICE_ROLE_KEY with real values.
-- Run this block separately once the edge function is deployed.

/*
SELECT cron.unschedule('yadosync-poll-booking-feed');

SELECT cron.schedule(
  'yadosync-poll-booking-feed',
  '* * * * *',   -- every minute
  $$
  SELECT net.http_post(
    url     := 'YOUR_SUPABASE_URL/functions/v1/pollBookingFeed',
    body    := '{"source":"cron"}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
*/
