-- ============================================================
-- Migration: Add missing columns to rate_plans
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Additional information
ALTER TABLE rate_plans
  ADD COLUMN IF NOT EXISTS tax_set_id          text        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parent_rate_plan_id uuid        DEFAULT NULL REFERENCES rate_plans(id) ON DELETE SET NULL;

-- Fees
ALTER TABLE rate_plans
  ADD COLUMN IF NOT EXISTS children_fee        numeric(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS infant_fee          numeric(10,2) NOT NULL DEFAULT 0.00;

-- Stay restrictions (single representative value broadcast to all 7 days)
ALTER TABLE rate_plans
  ADD COLUMN IF NOT EXISTS min_stay_arrival    integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_stay_through    integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_stay            integer NOT NULL DEFAULT 0,   -- 0 = no limit
  ADD COLUMN IF NOT EXISTS closed_to_arrival   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS closed_to_departure boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stop_sell           boolean NOT NULL DEFAULT false;

-- Inherit flags — stored as a single JSONB object instead of 10 separate columns.
-- Shape: { rate, closed_to_arrival, closed_to_departure, stop_sell,
--          min_stay_arrival, min_stay_through, max_stay,
--          max_sell, max_availability, availability_offset }
ALTER TABLE rate_plans
  ADD COLUMN IF NOT EXISTS inherit_settings jsonb NOT NULL DEFAULT '{
    "rate": false,
    "closed_to_arrival": false,
    "closed_to_departure": false,
    "stop_sell": false,
    "min_stay_arrival": false,
    "min_stay_through": false,
    "max_stay": false,
    "max_sell": false,
    "max_availability": false,
    "availability_offset": false
  }'::jsonb;

-- Occupancy options — array of { occupancy, is_primary, rate } objects.
-- Defaults to a single primary occupancy slot; updated when the user configures pricing tiers.
ALTER TABLE rate_plans
  ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[
    {"occupancy": 1, "is_primary": true, "rate": 0}
  ]'::jsonb;

-- Auto-rate settings — reserved for future Channex auto-pricing configuration.
ALTER TABLE rate_plans
  ADD COLUMN IF NOT EXISTS auto_rate_settings jsonb DEFAULT NULL;
