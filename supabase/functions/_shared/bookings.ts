/**
 * _shared/bookings.ts
 *
 * Shared booking-ingestion logic used by both pollBookingFeed and
 * channex-webhook. Both functions call applyRevision() identically —
 * the only difference is where the revision comes from.
 *
 * apply logic:
 *   new          → upsert into bookings (idempotent on channex_booking_id)
 *   cancellation → set status = 'cancelled'
 *   modified     → set status = 'modified_pending', store raw payload + notes
 *                  (human review required — do NOT auto-apply date/rate changes)
 *
 * ACK is the caller's responsibility. This file only applies to Supabase.
 * The caller must ack AFTER a successful apply and NOT ack on error.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { BookingRevision } from "./channex.ts";

export type ApplyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Apply a single Channex booking revision to the Supabase `bookings` table.
 *
 * @param revision   The revision object from the feed or a single-revision GET
 * @param supabase   A Supabase client with service role (bypasses RLS)
 * @returns          { ok: true } on success, { ok: false, reason } on failure
 */
export async function applyRevision(
  revision: BookingRevision,
  supabase: ReturnType<typeof createClient>,
): Promise<ApplyResult> {
  const attr = revision.attributes;
  const status = attr.status;  // "new" | "modified" | "cancellation"

  // ── Map Channex customer → YadoSync guest fields ─────────────────────────
  const guestName = [attr.customer?.name, attr.customer?.surname]
    .filter(Boolean)
    .join(" ") || null;

  // First room in the booking (YadoSync currently stores one room per booking)
  const firstRoom = attr.rooms?.[0];

  // ── Build the row we'll upsert / update ──────────────────────────────────
  const now = new Date().toISOString();

  try {
    if (status === "new") {
      // ── New booking: upsert (idempotent on channex_booking_id) ────────────
      const row = {
        // Use booking_id as the dedup key (stable across revisions)
        channex_booking_id:   attr.booking_id,
        channex_revision_id:  attr.id,
        property_id:          attr.property_id,
        ota_name:             attr.ota_name      || null,
        ota_reservation_code: attr.ota_reservation_code || null,
        status:               "confirmed",
        guest_name:           guestName,
        guest_email:          attr.customer?.mail  || null,
        guest_phone:          attr.customer?.phone || null,
        room_type_id:         firstRoom?.room_type_id || null,
        check_in:             attr.arrival_date,
        check_out:            attr.departure_date,
        amount:               attr.amount ? parseFloat(attr.amount) : null,
        currency:             attr.currency || "USD",
        raw_payload:          revision as unknown as Record<string, unknown>,
        booked_at:            attr.inserted_at || now,
        updated_at:           now,
      };

      const { error } = await supabase
        .from("bookings")
        .upsert(row, { onConflict: "channex_booking_id" });

      if (error) {
        return { ok: false, reason: `Supabase upsert failed: ${error.message}` };
      }

      console.log(`[bookings] Applied new booking ${attr.booking_id} (${attr.ota_name})`);
      return { ok: true };

    } else if (status === "cancellation") {
      // ── Cancellation: mark the existing booking as cancelled ──────────────
      const { error } = await supabase
        .from("bookings")
        .update({
          status:              "cancelled",
          channex_revision_id: attr.id,
          raw_payload:         revision as unknown as Record<string, unknown>,
          updated_at:          now,
        })
        .eq("channex_booking_id", attr.booking_id);

      if (error) {
        return { ok: false, reason: `Supabase cancel update failed: ${error.message}` };
      }

      console.log(`[bookings] Cancelled booking ${attr.booking_id}`);
      return { ok: true };

    } else if (status === "modified") {
      // ── Modification: flag for human review — do NOT auto-apply ──────────
      // Store the new raw payload and a human-readable note describing what
      // changed. The property owner must review and confirm in the UI.
      const notes = buildModificationNote(attr);

      const { error } = await supabase
        .from("bookings")
        .update({
          status:              "modified_pending",
          channex_revision_id: attr.id,
          raw_payload:         revision as unknown as Record<string, unknown>,
          notes,
          updated_at:          now,
        })
        .eq("channex_booking_id", attr.booking_id);

      if (error) {
        return { ok: false, reason: `Supabase modification update failed: ${error.message}` };
      }

      console.log(`[bookings] Flagged modified booking ${attr.booking_id} for review`);
      return { ok: true };

    } else {
      // Unknown status — ack to drain the feed but log a warning
      console.warn(`[bookings] Unknown revision status "${status}" for booking ${attr.booking_id} — acking to drain`);
      return { ok: true };
    }
  } catch (err: any) {
    return { ok: false, reason: err?.message ?? "Unknown error in applyRevision" };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a short human-readable note for a modified booking so the
 * property owner knows what changed without reading raw JSON.
 */
function buildModificationNote(attr: BookingRevision["attributes"]): string {
  const lines: string[] = [
    `Modification received from ${attr.ota_name ?? "OTA"} at ${new Date().toISOString()}.`,
    `New dates: ${attr.arrival_date} → ${attr.departure_date}`,
    `New amount: ${attr.amount} ${attr.currency}`,
  ];

  if (attr.notes) {
    lines.push(`Guest notes: ${attr.notes}`);
  }

  lines.push("Review and confirm changes manually.");
  return lines.join("\n");
}
