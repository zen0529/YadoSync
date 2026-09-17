-- Migration: 20260918_bookings_commission
--
-- Adds the commission_amount column to the bookings table.
-- The per-property total_commission rollup is handled in TypeScript
-- (_shared/updatePropertyCommission.ts) and is called explicitly by
-- applyRevision.ts after a successful booking upsert or cancellation.
--
-- Changes:
--   1. bookings.commission_amount — stores the per-booking platform commission
--                                   (SUM(rooms[].amount) × commission_rate / 100)

-- ── 1. Add commission_amount column ──────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_amount numeric;

COMMENT ON COLUMN bookings.commission_amount IS
  'Platform commission earned on this booking. '
  'Calculated at ingestion time as SUM(rooms[].amount) × (properties.commission_rate / 100). '
  'Set to 0 on cancellation. NULL means the property has no commission_rate configured.';
