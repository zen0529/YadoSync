-- Migration: 20260922_notifications_schema_realtime.sql
--
-- 1. Adds message and booking_id columns to notifications.
-- 2. Enables Realtime publication for notifications and bookings.
-- 3. Adds RLS policies for property owners to view and update their own notifications.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS booking_id text;

-- Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- RLS policies on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can view own notifications"
  ON notifications FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "owners can update own notifications"
  ON notifications FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );
