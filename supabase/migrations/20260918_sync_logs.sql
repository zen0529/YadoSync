-- ============================================================
-- sync_logs updates
-- Ensures sync_logs has type and payload columns for recovery and poller logs
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text,
  status     text,
  platform   varchar,
  message    varchar,
  payload    jsonb,
  booking_id uuid,
  synced_at  timestamp without time zone,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sync_logs 
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS payload jsonb;

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
