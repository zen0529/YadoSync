-- ============================================================
-- Phase 2: Rate Plans
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create the rate_plans table
CREATE TABLE IF NOT EXISTS rate_plans (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id          uuid        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id         uuid        NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  channex_rate_plan_id text        NOT NULL UNIQUE,
  title                text        NOT NULL,
  currency             text        NOT NULL DEFAULT 'PHP',
  sell_mode            text        NOT NULL DEFAULT 'per_room',   -- 'per_room' | 'per_person'
  rate_mode            text        NOT NULL DEFAULT 'manual',     -- 'manual' | 'derived'
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes for common queries
CREATE INDEX IF NOT EXISTS rate_plans_property_id_idx  ON rate_plans (property_id);
CREATE INDEX IF NOT EXISTS rate_plans_room_type_id_idx ON rate_plans (room_type_id);

-- 3. Enable Row Level Security
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;

-- 4. Owners: read-only access to their own property's rate plans
CREATE POLICY "owners_can_select_own_rate_plans"
  ON rate_plans
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- 5. Superadmin: full access
CREATE POLICY "superadmin_full_access_rate_plans"
  ON rate_plans
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
