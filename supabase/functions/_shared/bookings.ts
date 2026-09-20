/**
 * _shared/bookings.ts
 *
 * Revision failure tracking helpers: upsertRevisionFailure, markRevisionResolved,
 * and markRevisionRecoveredByBookingId.
 * Used by pollBookingFeed and recoverMissingBookings.
 *
 * apply logic lives in _shared/bookingsPage/applyRevision.ts.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { ErrorKind } from "./bookingsPage/classifyError.ts";

// ── Revision failure tracking ─────────────────────────────────────────────────

/**
 * Upsert a failure record for a revision that could not be applied.
 *
 * Uses a single Postgres function (`upsert_revision_failure`) that does an
 * atomic INSERT ... ON CONFLICT DO UPDATE so attempt_count is incremented
 * safely without a read-modify-write race.
 *
 * Returns the row so the caller can check first_failed_at against the
 * 30-minute Channex feed expiry window.
 *
 * The backing SQL function is defined in:
 *   supabase/migrations/20260916_revision_failures.sql
 */
export async function upsertRevisionFailure(
  supabase: ReturnType<typeof createClient>,
  revisionId: string,
  bookingId: string | null,
  reason: string,
  kind: ErrorKind,
): Promise<{ first_failed_at: string }> {
  const now = new Date().toISOString();

  const { data, error } = await supabase.rpc("upsert_revision_failure", {
    p_revision_id:  revisionId,
    p_booking_id:   bookingId,
    p_last_error:   reason,
    p_error_kind:   kind,
    p_tried_at:     now,
  });

  if (error || !data) {
    // Failure tracking itself failed — log but don't throw; the original apply
    // failure is what matters. Return a safe fallback so the caller can still
    // check the 30-minute window (worst case we use now, which is conservative).
    console.error("[bookings] Failed to upsert revision_failure record:", error?.message);
    return { first_failed_at: now };
  }

  return { first_failed_at: data.first_failed_at };
}

/**
 * Mark a revision failure as resolved after a successful apply.
 * Called by pollBookingFeed immediately after applyRevision returns ok: true.
 */
export async function markRevisionResolved(
  supabase: ReturnType<typeof createClient>,
  revisionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("revision_failures")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("revision_id", revisionId)
    .eq("resolved", false);

  if (error) {
    // Non-fatal — the booking was saved successfully. Just log.
    console.error(`[bookings] Failed to mark revision ${revisionId} as resolved:`, error.message);
  }
}

/**
 * Mark all unresolved revision failures for a booking ID as resolved.
 * Called by recoverMissingBookings after a missing booking is successfully recovered.
 */
export async function markRevisionRecoveredByBookingId(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
): Promise<void> {
  const { error } = await supabase
    .from("revision_failures")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .eq("resolved", false);

  if (error) {
    console.error(
      `[bookings] Failed to mark revision failures resolved for booking ${bookingId}:`,
      error.message,
    );
  }
}
