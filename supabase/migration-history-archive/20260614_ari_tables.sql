-- ============================================================
-- Phase 3: ARI Push — availability + restrictions tables
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. availability table ──────────────────────────────────────────────────
-- Source of truth for per-date room availability (UI + Channex push source).
-- Rates are in integer counts (number of rooms available).

CREATE TABLE IF NOT EXISTS availability (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid        NOT NULL REFERENCES properties(id)   ON DELETE CASCADE,
  room_type_id  uuid        NOT NULL REFERENCES room_types(id)   ON DELETE CASCADE,
  date          date        NOT NULL,
  available     integer     NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_type_id, date)
);

CREATE INDEX IF NOT EXISTS availability_property_id_idx  ON availability (property_id);
CREATE INDEX IF NOT EXISTS availability_room_type_id_idx ON availability (room_type_id);
CREATE INDEX IF NOT EXISTS availability_date_idx         ON availability (date);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Owners: full access to their own property's availability rows
CREATE POLICY "owners_full_access_availability"
  ON availability
  FOR ALL
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- Superadmin: full access
CREATE POLICY "superadmin_full_access_availability"
  ON availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'superadmin'
    )
  );


-- ── 2. restrictions table ──────────────────────────────────────────────────
-- Source of truth for per-date rate plan restrictions (UI + Channex push source).
-- rate is stored in MINOR units (cents) to match Channex write API.

CREATE TABLE IF NOT EXISTS restrictions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id          uuid        NOT NULL REFERENCES properties(id)   ON DELETE CASCADE,
  rate_plan_id         uuid        NOT NULL REFERENCES rate_plans(id)   ON DELETE CASCADE,
  date                 date        NOT NULL,
  rate                 integer     NOT NULL DEFAULT 0,          -- cents (minor units)
  min_stay_arrival     integer              DEFAULT 1,
  stop_sell            boolean              DEFAULT false,
  closed_to_arrival    boolean              DEFAULT false,
  closed_to_departure  boolean              DEFAULT false,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rate_plan_id, date)
);

CREATE INDEX IF NOT EXISTS restrictions_property_id_idx  ON restrictions (property_id);
CREATE INDEX IF NOT EXISTS restrictions_rate_plan_id_idx ON restrictions (rate_plan_id);
CREATE INDEX IF NOT EXISTS restrictions_date_idx         ON restrictions (date);

ALTER TABLE restrictions ENABLE ROW LEVEL SECURITY;

-- Owners: full access to their own property's restriction rows
CREATE POLICY "owners_full_access_restrictions"
  ON restrictions
  FOR ALL
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- Superadmin: full access
CREATE POLICY "superadmin_full_access_restrictions"
  ON restrictions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'superadmin'
    )
  );


-- ── 3. pg_cron: hourly full-sync drift correction ─────────────────────────
-- Calls the fullSyncARI edge function once an hour to re-push all ARI data.
-- This ensures no missed event can permanently desynchronize Channex.
--
-- Requires: pg_cron extension (enabled by default on Supabase free & pro plans).
-- The SUPABASE_URL and SERVICE_ROLE_KEY below are filled in automatically
-- by Supabase when the extension runs; replace the placeholder URL with your
-- actual project URL before running this block.
--
-- To verify pg_cron is enabled: SELECT * FROM cron.job;
-- To remove the job: SELECT cron.unschedule('yadosync-full-sync-ari');

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'yadosync-full-sync-ari',       -- job name (unique)
  '0 * * * *',                    -- every hour on the hour
  $$
  SELECT net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/fullSyncARI',
    body   := '{"source":"cron"}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  );
  $$
);

-- NOTE: You must set app.supabase_url and app.service_role_key in your
-- Supabase project settings (Database → Configuration → Parameters), OR
-- replace the current_setting() calls above with your literal values:
--
--   url := 'https://<your-project-ref>.supabase.co/functions/v1/fullSyncARI'
--   'Authorization', 'Bearer <your-service-role-key>'
--
-- The pg_net extension (required for net.http_post) is also enabled by
-- default on Supabase. If you get "function net.http_post does not exist",
-- run: CREATE EXTENSION IF NOT EXISTS pg_net;
