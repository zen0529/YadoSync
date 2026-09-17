/**
 * _shared/bookingsPage/applyRevision.ts
 *
 * Single responsibility: apply a single Channex booking revision to the
 * Supabase `bookings` table.
 * Used by both pollBookingFeed and channex-webhook.
 *
 * apply logic:
 *   new          → upsert into bookings with status = 'new' (idempotent on channex_booking_id)
 *                  + compute commission from SUM(rooms[].amount)
 *                  + update properties.total_commission
 *   cancellation → set status = 'cancellation', zero commission_amount
 *                  + update properties.total_commission
 *   modified     → set status = 'modified', store raw payload + notes
 *                  (human review required — do NOT auto-apply date/rate changes)
 *
 * ACK is the caller's responsibility. This file only applies to Supabase.
 * The caller must ack AFTER a successful apply and NOT ack on error.
 *
 * Error classification lives in ./classifyError.ts (single responsibility).
 * Commission rollup lives in ../_shared/updatePropertyCommission.ts.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { BookingRevision, BookingRoom } from "../channex.ts";
import { classifyError, type ErrorKind } from "./classifyError.ts";
import { updatePropertyCommission } from "../updatePropertyCommission.ts";

export type { ErrorKind };

export type ApplyResult =
  | { ok: true }
  | { ok: false; reason: string; kind: ErrorKind };

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

  // ── Build the row we'll upsert / update ──────────────────────────────────
  const now = new Date().toISOString();

  try {
    if (status === "new") {
      // ── New booking: upsert (idempotent on channex_booking_id) ────────────

      // Commission is calculated from the per-room amounts, not the booking-level
      // attr.amount. Fall back to attr.amount only for edge-case payloads without rooms.
      const roomsTotal = sumRoomAmounts(attr.rooms ?? []);
      const commissionAmount = await calculateCommission(
        supabase,
        attr.property_id,
        roomsTotal,
      );

      const row = {
        // Use booking_id as the dedup key (stable across revisions)
        channex_booking_id: attr.booking_id,
        channex_revision_id: attr.id,
        property_id: attr.property_id,
        ota_name: attr.ota_name || null,
        ota_reservation_code: attr.ota_reservation_code || null,
        status: "new",
        guest_name: guestName,
        guest_email: attr.customer?.mail || null,
        guest_phone: attr.customer?.phone || null,
        booked_rooms: attr.rooms ?? [],
        check_in: attr.arrival_date,
        check_out: attr.departure_date,
        // Prefer rooms sum; fall back to top-level attr.amount for payloads with no rooms[]
        amount: roomsTotal || (attr.amount ? parseFloat(attr.amount) : null),
        commission_amount: commissionAmount,
        currency: attr.currency || "USD",
        raw_payload: revision as unknown as Record<string, unknown>,
        booked_at: attr.inserted_at || now,
        updated_at: now,
      };

      const { error } = await supabase
        .from("bookings")
        .upsert(row, { onConflict: "channex_booking_id" });

      if (error) {
        return { ok: false, reason: `Supabase upsert failed: ${error.message}`, kind: classifyError(error) };
      }

      console.log(
        `[applyRevision] New booking ${attr.booking_id} (${attr.ota_name}) — ` +
        `roomsTotal=${roomsTotal} commission=${commissionAmount ?? "null (no rate)"}`,
      );

      // Roll up total_commission on the property (non-fatal if it fails)
      await updatePropertyCommission(supabase, attr.property_id);

      return { ok: true };

    } else if (status === "cancellation") {
      // ── Cancellation: mark the existing booking as cancelled ──────────────
      // Zero out commission_amount so the rollup correctly excludes this booking.
      // .select("id, property_id") is required to detect zero rows affected and
      // to get the property_id for the commission rollup.
      const { data: cancelled, error } = await supabase
        .from("bookings")
        .update({
          status: "cancellation",
          channex_revision_id: attr.id,
          commission_amount: 0,
          raw_payload: revision as unknown as Record<string, unknown>,
          updated_at: now,
        })
        .eq("channex_booking_id", attr.booking_id)
        .select("id, property_id");

      if (error) {
        return { ok: false, reason: `Supabase cancel update failed: ${error.message}`, kind: classifyError(error) };
      }
      if (!cancelled || cancelled.length === 0) {
        // Parent booking not in our DB yet — the "new" revision may still be in
        // the feed ahead of this cancellation. Treat as transient: retry next cycle.
        return { ok: false, reason: `Cancellation for unknown booking ${attr.booking_id} — parent not found, will retry`, kind: "transient" };
      }

      console.log(`[applyRevision] Cancelled booking ${attr.booking_id}`);

      // Roll up total_commission on the property (non-fatal if it fails)
      const propertyId = cancelled[0].property_id ?? attr.property_id;
      await updatePropertyCommission(supabase, propertyId);

      return { ok: true };

    } else if (status === "modified") {
      // ── Modification: flag for human review — do NOT auto-apply ──────────
      // Store the new raw payload and a human-readable note describing what
      // changed. The property owner must review and confirm in the UI.
      // Commission IS recalculated from the new payload's room amounts so the
      // stored value always reflects the latest rate sent by the OTA.
      const roomsTotal = sumRoomAmounts(attr.rooms ?? []);
      const commissionAmount = await calculateCommission(
        supabase,
        attr.property_id,
        roomsTotal,
      );

      const notes = buildModificationNote(attr);

      // .select("id, property_id") is required to detect zero rows affected
      // and to retrieve the property_id for the commission rollup.
      const { data: modified, error } = await supabase
        .from("bookings")
        .update({
          status: "modified",
          channex_revision_id: attr.id,
          amount: roomsTotal || (attr.amount ? parseFloat(attr.amount) : null),
          commission_amount: commissionAmount,
          raw_payload: revision as unknown as Record<string, unknown>,
          notes,
          updated_at: now,
        })
        .eq("channex_booking_id", attr.booking_id)
        .select("id, property_id");

      if (error) {
        return { ok: false, reason: `Supabase modification update failed: ${error.message}`, kind: classifyError(error) };
      }
      if (!modified || modified.length === 0) {
        // Parent booking not in our DB yet. Treat as transient: retry next cycle.
        return { ok: false, reason: `Modification for unknown booking ${attr.booking_id} — parent not found, will retry`, kind: "transient" };
      }

      console.log(
        `[applyRevision] Flagged modified booking ${attr.booking_id} for review — ` +
        `roomsTotal=${roomsTotal} commission=${commissionAmount ?? "null (no rate)"}`,
      );

      // Roll up total_commission on the property (non-fatal if it fails)
      const propertyId = modified[0].property_id ?? attr.property_id;
      await updatePropertyCommission(supabase, propertyId);

      return { ok: true };

    } else {
      // Unknown status — ack to drain the feed but log a warning
      console.warn(`[applyRevision] Unknown revision status "${status}" for booking ${attr.booking_id} — acking to drain`);
      return { ok: true };
    }
  } catch (err: any) {
    return { ok: false, reason: err?.message ?? "Unknown error in applyRevision", kind: classifyError(err) };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sum the `amount` field across all rooms in a Channex revision.
 * This is the commissionable base — e.g. 2 rooms at 76.50 = 153.00.
 * Returns 0 if rooms is empty or amounts are malformed.
 */
function sumRoomAmounts(rooms: BookingRoom[]): number {
  if (!Array.isArray(rooms) || rooms.length === 0) return 0;
  return rooms.reduce((total, room) => {
    return total + (parseFloat(room.amount ?? "0") || 0);
  }, 0);
}

/**
 * Fetch the property's commission_rate and compute the commission amount.
 * Returns null if the property has no commission_rate configured.
 *
 * Example: roomsTotal=153.00, commission_rate=10 → 15.30
 */
async function calculateCommission(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
  roomsTotal: number,
): Promise<number | null> {
  if (roomsTotal <= 0) return null;

  const { data, error } = await supabase
    .from("properties")
    .select("commission_rate")
    .eq("id", propertyId)
    .single();

  if (error) {
    // Non-fatal — log and return null so the booking is still saved
    console.error(
      `[applyRevision] Could not fetch commission_rate for property ${propertyId}:`,
      error.message,
    );
    return null;
  }

  if (!data?.commission_rate) return null;

  return parseFloat((roomsTotal * (data.commission_rate / 100)).toFixed(2));
}

/**
 * Build a short human-readable note for a modified booking so the
 * property owner knows what changed without reading raw JSON.
 */
function buildModificationNote(attr: BookingRevision["attributes"]): string {
  const lines: string[] = [
    `Modification received from ${attr.ota_name ?? "OTA"} at ${new Date().toISOString()}.`,
    `New dates: ${attr.arrival_date} → ${attr.departure_date}`,
    `New rooms total: ${sumRoomAmounts(attr.rooms ?? [])} ${attr.currency}`,
  ];

  if (attr.notes) {
    lines.push(`Guest notes: ${attr.notes}`);
  }

  lines.push("Review and confirm changes manually.");
  return lines.join("\n");
}
