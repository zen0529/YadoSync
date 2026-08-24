-- Add status column to rate_plans
-- 'active'   = live, visible in the UI
-- 'inactive' = zombie row (Channex was re-created after a failed Supabase delete);
--              kept for audit/reference but hidden from the UI
ALTER TABLE public.rate_plans
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

-- Index to make the status filter cheap
CREATE INDEX IF NOT EXISTS idx_rate_plans_status
  ON public.rate_plans (status);
