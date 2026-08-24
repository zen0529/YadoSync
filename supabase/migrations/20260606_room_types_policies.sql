-- ============================================================
-- Phase 2: Room Types Policies
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Enable Row Level Security (if not already enabled)
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- 2. Owners: full access to their own property's room types
DROP POLICY IF EXISTS "owners_can_manage_own_room_types" ON room_types;
CREATE POLICY "owners_can_manage_own_room_types"
  ON room_types
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

-- 3. Superadmin: full access
DROP POLICY IF EXISTS "superadmin_full_access_room_types" ON room_types;
CREATE POLICY "superadmin_full_access_room_types"
  ON room_types
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