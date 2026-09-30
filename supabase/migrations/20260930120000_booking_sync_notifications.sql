BEGIN;

ALTER TABLE public.revision_failures
  ADD COLUMN property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN channex_property_id text,
  ADD COLUMN reservation_code text;

ALTER TABLE public.notifications ADD COLUMN sync_revision_id text;
CREATE UNIQUE INDEX notifications_sync_revision_type_idx
  ON public.notifications (sync_revision_id, type)
  WHERE sync_revision_id IS NOT NULL;

-- Historical failures with no saved booking have no trustworthy owner mapping.
-- They remain admin-only until a retry supplies their Channex property ID.
UPDATE public.revision_failures AS f
SET property_id = b.property_id, reservation_code = b.ota_reservation_code
FROM public.bookings AS b
WHERE b.channex_booking_id = f.booking_id AND f.property_id IS NULL;

ALTER TABLE public.revision_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated users can read unresolved revision_failures"
  ON public.revision_failures;
REVOKE ALL ON public.revision_failures FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.revision_failures FROM authenticated;

-- Owners may acknowledge notifications, never manufacture or rewrite them.
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (status) ON public.notifications TO authenticated;
DROP POLICY IF EXISTS "owners can view own notifications" ON public.notifications;
CREATE POLICY "owners can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (channel = 'in_app' AND property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "owners can update own notifications" ON public.notifications;
CREATE POLICY "owners can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (channel = 'in_app' AND property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  ))
  WITH CHECK (channel = 'in_app' AND status IN ('read', 'unread') AND property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  ));

-- Keep the old RPC for deployed callers, but restrict it to the backend.
REVOKE ALL ON FUNCTION public.upsert_revision_failure(text, text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_revision_failure(text, text, text, text, timestamptz)
  TO service_role;

CREATE FUNCTION public.record_booking_sync_failure(
  p_revision_id text,
  p_booking_id text,
  p_last_error text,
  p_error_kind text,
  p_channex_property_id text,
  p_reservation_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  local_property_id uuid;
  failure public.revision_failures;
BEGIN
  -- Ambiguous or unknown mappings must not disclose a booking to an owner.
  SELECT (array_agg(p.id))[1] INTO local_property_id
  FROM public.properties p
  WHERE p.channex_property_id = p_channex_property_id
  HAVING count(*) = 1;

  INSERT INTO public.revision_failures AS existing (
    revision_id, booking_id, last_error, error_kind, first_failed_at, last_tried_at,
    property_id, channex_property_id, reservation_code
  ) VALUES (
    p_revision_id, p_booking_id, p_last_error, p_error_kind, now(), now(),
    local_property_id, p_channex_property_id, p_reservation_code
  )
  ON CONFLICT (revision_id) WHERE resolved = false DO UPDATE SET
    attempt_count = existing.attempt_count + 1,
    last_error = EXCLUDED.last_error,
    error_kind = EXCLUDED.error_kind,
    last_tried_at = EXCLUDED.last_tried_at,
    property_id = coalesce(existing.property_id, EXCLUDED.property_id),
    channex_property_id = coalesce(existing.channex_property_id, EXCLUDED.channex_property_id),
    reservation_code = coalesce(existing.reservation_code, EXCLUDED.reservation_code)
  RETURNING * INTO failure;

  RETURN jsonb_build_object('first_failed_at', failure.first_failed_at);
END;
$$;
REVOKE ALL ON FUNCTION public.record_booking_sync_failure(text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_booking_sync_failure(text, text, text, text, text, text)
  TO service_role;

-- Called on every poll cycle, including empty/failed feed requests. Notification
-- delivery is retried from durable incident state and cannot block booking ACKs.
CREATE FUNCTION public.dispatch_booking_sync_notifications() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  incident record;
  event_type text;
  event_message text;
  inserted_count integer;
  total_inserted integer := 0;
BEGIN
  UPDATE public.revision_failures f
  SET property_id = mappings.id
  FROM (
    SELECT channex_property_id, (array_agg(id))[1] AS id
    FROM public.properties
    WHERE channex_property_id IS NOT NULL
    GROUP BY channex_property_id HAVING count(*) = 1
  ) mappings
  WHERE f.property_id IS NULL AND f.channex_property_id = mappings.channex_property_id;

  FOR incident IN
    SELECT f.*, p.name AS property_name
    FROM public.revision_failures f JOIN public.properties p ON p.id = f.property_id
    WHERE (
      NOT f.resolved
      AND (f.error_kind = 'permanent' OR f.first_failed_at <= now() - interval '25 minutes')
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.sync_revision_id = f.revision_id AND n.type = 'booking_sync_issue'
      )
    ) OR (
      f.resolved
      AND EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.sync_revision_id = f.revision_id AND n.type = 'booking_sync_issue'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.sync_revision_id = f.revision_id AND n.type = 'booking_sync_restored'
      )
    )
    ORDER BY f.first_failed_at, f.id
    LIMIT 200
    FOR UPDATE OF f SKIP LOCKED
  LOOP
    IF incident.resolved THEN
      event_type := 'booking_sync_restored';
      event_message := format(
        'The reported booking sync issue for %s has been resolved. The booking data has been saved.',
        coalesce(incident.property_name, 'your property')
      );
    ELSE
      event_type := 'booking_sync_issue';
      event_message := format(
        'A booking for %s has not synced successfully. Your calendar may be missing a booking or an update. Manual recovery may be needed. Contact support.',
        coalesce(incident.property_name, 'your property')
      );
    END IF;
    IF nullif(incident.reservation_code, '') IS NOT NULL THEN
      event_message := event_message || ' Reservation reference: ' || incident.reservation_code || '.';
    END IF;

    INSERT INTO public.notifications (
      property_id, booking_id, type, channel, status, message, sync_revision_id
    ) VALUES (
      incident.property_id, incident.booking_id, event_type, 'in_app', 'unread',
      event_message, incident.revision_id
    ) ON CONFLICT (sync_revision_id, type) WHERE sync_revision_id IS NOT NULL DO NOTHING;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    total_inserted := total_inserted + inserted_count;
  END LOOP;
  RETURN total_inserted;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_booking_sync_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_booking_sync_notifications() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

COMMIT;
