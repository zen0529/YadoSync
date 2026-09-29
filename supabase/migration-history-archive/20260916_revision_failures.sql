-- ============================================================
-- revision_failures table
-- Tracks every failed applyRevision() attempt per Channex revision.
--
-- Purpose:
--   The pg_cron poller runs once per minute and has no memory between
--   runs. This table gives it a durable record of:
--     - How many times a revision has been retried (attempt_count)
--     - When the first failure occurred (first_failed_at) — used to
--       detect when the 30-minute Channex feed expiry window has passed
--     - The last error message for debugging
--     - Whether the revision was eventually saved (resolved)
--
-- A unique partial index on (revision_id) WHERE resolved = false ensures
-- there is never more than one active failure record per revision.
-- ============================================================

CREATE TABLE IF NOT EXISTS revision_failures (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Channex revision ID — the stable identifier for the failed revision
  revision_id      text        NOT NULL,

  -- Channex booking ID — null if the revision payload was malformed
  booking_id       text,

  -- How many apply attempts have been made for this revision
  attempt_count    int         NOT NULL DEFAULT 1,

  -- The error message from the most recent failed attempt
  last_error       text,

  -- Error kind from the most recent attempt: 'transient' or 'permanent'
  error_kind       text        CHECK (error_kind IN ('transient', 'permanent')),

  -- When the very first failure occurred — used to check the 30-min window
  first_failed_at  timestamptz NOT NULL DEFAULT now(),

  -- When we last attempted to apply this revision
  last_tried_at    timestamptz NOT NULL DEFAULT now(),

  -- Whether the revision was eventually successfully applied
  resolved         boolean     NOT NULL DEFAULT false,
  resolved_at      timestamptz
);

-- Unique partial index: at most one active (unresolved) record per revision.
-- Resolved rows are excluded so historical records are preserved for audit.
CREATE UNIQUE INDEX IF NOT EXISTS revision_failures_active_revision_idx
  ON revision_failures (revision_id)
  WHERE resolved = false;

-- Index for the superadmin recovery query: find unresolved failures older than 30 min
CREATE INDEX IF NOT EXISTS revision_failures_unresolved_age_idx
  ON revision_failures (first_failed_at)
  WHERE resolved = false;

-- Row-Level Security
-- Edge functions use the service role key which bypasses RLS.
-- Property owners have no reason to query this table directly.
ALTER TABLE revision_failures ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- upsert_revision_failure()
--
-- Called by the _shared/bookings.ts upsertRevisionFailure() helper.
-- Does an atomic INSERT ... ON CONFLICT DO UPDATE so attempt_count
-- is incremented without a separate SELECT + UPDATE round trip.
--
-- Returns the full row so the caller can read first_failed_at
-- to check whether the 30-minute Channex feed window has expired.
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_revision_failure(
  p_revision_id  text,
  p_booking_id   text,
  p_last_error   text,
  p_error_kind   text,
  p_tried_at     timestamptz
)
RETURNS TABLE (
  revision_id      text,
  booking_id       text,
  attempt_count    int,
  last_error       text,
  error_kind       text,
  first_failed_at  timestamptz,
  last_tried_at    timestamptz,
  resolved         boolean
)
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as the function owner (bypasses RLS)
AS $$
BEGIN
  INSERT INTO revision_failures (
    revision_id, booking_id, attempt_count,
    last_error, error_kind,
    first_failed_at, last_tried_at
  )
  VALUES (
    p_revision_id, p_booking_id, 1,
    p_last_error, p_error_kind,
    p_tried_at, p_tried_at
  )
  ON CONFLICT (revision_id) WHERE resolved = false
  DO UPDATE SET
    attempt_count = revision_failures.attempt_count + 1,
    last_error    = EXCLUDED.last_error,
    error_kind    = EXCLUDED.error_kind,
    last_tried_at = EXCLUDED.last_tried_at;

  RETURN QUERY
  SELECT
    rf.revision_id, rf.booking_id, rf.attempt_count,
    rf.last_error, rf.error_kind,
    rf.first_failed_at, rf.last_tried_at, rf.resolved
  FROM revision_failures rf
  WHERE rf.revision_id = p_revision_id
    AND rf.resolved = false;
END;
$$;
