-- ============================================================
-- Superadmin RLS policies for sync_logs and revision_failures
-- ============================================================

CREATE POLICY "superadmin can read all sync_logs"
  ON sync_logs
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );

CREATE POLICY "superadmin can read all revision_failures"
  ON revision_failures
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );
