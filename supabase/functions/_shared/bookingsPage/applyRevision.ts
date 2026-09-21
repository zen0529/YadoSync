/**
 * _shared/bookingsPage/applyRevision.ts
 *
 * Single responsibility: apply a single Channex booking revision to the
 * Supabase `bookings` table.
 * Used by pollBookingFeed, channex-webhook, and recoverMissingBookings.
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
 * Property resolution lives in ./resolveProperty.ts.
 * Commission rollup lives in ../_shared/updatePropertyCommission.ts.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { BookingRevision, BookingRoom } from "../channex.ts";
import { classifyError, type ErrorKind } from "./classifyError.ts";
import { resolveProperty } from "./resolveProperty.ts";
import { updatePropertyCommission } from "../updatePropertyCommission.ts";

export type { ErrorKind };

export interface ApplyRevisionOptions {
  /**
   * If true, creates a new booking row when applying a 'cancellation' or 'modified'
   * revision whose parent booking does not exist in Supabase yet.
   * Useful for one-shot recovery from GET /bookings where only the latest state exists.
   */
  createIfMissing?: boolean;
}

export type ApplyResult =
  | { ok: true }
  | { ok: false; reason: string; kind: ErrorKind };

/**
 * Apply a single Channex booking revision to the Supabase `bookings` table.
 *
 * @param revision   The revision object from the feed or a single-revision GET
 * @param supabase   A Supabase client with service role (bypasses RLS)
 * @param options    Optional configuration (e.g. createIfMissing for recovery)
 * @returns          { ok: true } on success, { ok: false, reason } on failure
 */
export async function applyRevision(
  revision: BookingRevision,
  supabase: ReturnType<typeof createClient>,
  options: ApplyRevisionOptions = {},
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
      const property = await resolveProperty(supabase, attr.property_id);
      if (!property) {
        return {
          ok: false,
          reason: `Property ${attr.property_id} not registered in YadoSync`,
          kind: "permanent",
        };
      }

      // Commission is calculated from the per-room amounts, not the booking-level
      // attr.amount. Fall back to attr.amount only for edge-case payloads without rooms.
      const roomsTotal = sumRoomAmounts(attr.rooms ?? []);
      const commissionAmount = computeCommission(
        property.commission_rate,
        roomsTotal,
      );

      const row = {
        // Use booking_id as the dedup key (stable across revisions)
        channex_booking_id: attr.booking_id,
        channex_revision_id: attr.id,
        property_id: property.id,
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
        `[applyRevision] New booking ${attr.booking_id} (${attr.ota_name}) for property ${property.id} — ` +
        `roomsTotal=${roomsTotal} commission=${commissionAmount ?? "null (no rate)"}`,
      );

      // Roll up total_commission on the property (non-fatal if it fails)
      await updatePropertyCommission(supabase, property.id);

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
        // Fallback for recovery: if booking is missing from DB, insert it directly
        if (options.createIfMissing) {
          const property = await resolveProperty(supabase, attr.property_id);
          if (!property) {
            return {
              ok: false,
              reason: `Property ${attr.property_id} not registered in YadoSync`,
              kind: "permanent",
            };
          }

          const roomsTotal = sumRoomAmounts(attr.rooms ?? []);
          const row = {
            channex_booking_id: attr.booking_id,
            channex_revision_id: attr.id,
            property_id: property.id,
            ota_name: attr.ota_name || null,
            ota_reservation_code: attr.ota_reservation_code || null,
            status: "cancellation",
            guest_name: guestName,
            guest_email: attr.customer?.mail || null,
            guest_phone: attr.customer?.phone || null,
            booked_rooms: attr.rooms ?? [],
            check_in: attr.arrival_date,
            check_out: attr.departure_date,
            amount: roomsTotal || (attr.amount ? parseFloat(attr.amount) : null),
            commission_amount: 0,
            currency: attr.currency || "USD",
            raw_payload: revision as unknown as Record<string, unknown>,
            booked_at: attr.inserted_at || now,
            updated_at: now,
          };

          const { error: insertErr } = await supabase
            .from("bookings")
            .upsert(row, { onConflict: "channex_booking_id" });

          if (insertErr) {
            return { ok: false, reason: `Supabase cancel insert failed: ${insertErr.message}`, kind: classifyError(insertErr) };
          }

          console.log(`[applyRevision] Inserted missing cancelled booking ${attr.booking_id} for property ${property.id}`);
          await updatePropertyCommission(supabase, property.id);
          return { ok: true };
        }

        // Parent booking not in our DB yet — the "new" revision may still be in
        // the feed ahead of this cancellation. Treat as transient: retry next cycle.
        return { ok: false, reason: `Cancellation for unknown booking ${attr.booking_id} — parent not found, will retry`, kind: "transient" };
      }

      console.log(`[applyRevision] Cancelled booking ${attr.booking_id}`);

      // Roll up total_commission on the property (non-fatal if it fails)
      const propertyId = cancelled[0].property_id;
      if (propertyId) {
        await updatePropertyCommission(supabase, propertyId);
      }

      return { ok: true };

    } else if (status === "modified") {
      // ── Modification: flag for human review — do NOT auto-apply ──────────
      // Store the new raw payload and a human-readable note describing what
      // changed. The property owner must review and confirm in the UI.
      // Commission IS recalculated from the new payload's room amounts so the
      // stored value always reflects the latest rate sent by the OTA.
      const property = await resolveProperty(supabase, attr.property_id);
      const roomsTotal = sumRoomAmounts(attr.rooms ?? []);
      const commissionAmount = computeCommission(
        property?.commission_rate ?? null,
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
        // Fallback for recovery: if booking is missing from DB, insert it directly
        if (options.createIfMissing) {
          if (!property) {
            return {
              ok: false,
              reason: `Property ${attr.property_id} not registered in YadoSync`,
              kind: "permanent",
            };
          }

          const row = {
            channex_booking_id: attr.booking_id,
            channex_revision_id: attr.id,
            property_id: property.id,
            ota_name: attr.ota_name || null,
            ota_reservation_code: attr.ota_reservation_code || null,
            status: "modified",
            guest_name: guestName,
            guest_email: attr.customer?.mail || null,
            guest_phone: attr.customer?.phone || null,
            booked_rooms: attr.rooms ?? [],
            check_in: attr.arrival_date,
            check_out: attr.departure_date,
            amount: roomsTotal || (attr.amount ? parseFloat(attr.amount) : null),
            commission_amount: commissionAmount,
            currency: attr.currency || "USD",
            notes,
            raw_payload: revision as unknown as Record<string, unknown>,
            booked_at: attr.inserted_at || now,
            updated_at: now,
          };

          const { error: insertErr } = await supabase
            .from("bookings")
            .upsert(row, { onConflict: "channex_booking_id" });

          if (insertErr) {
            return { ok: false, reason: `Supabase modified insert failed: ${insertErr.message}`, kind: classifyError(insertErr) };
          }

          console.log(`[applyRevision] Inserted missing modified booking ${attr.booking_id} for property ${property.id}`);
          await updatePropertyCommission(supabase, property.id);

          // Write in-app notification for the property owner
          const notificationMessage = `Booking from ${attr.ota_name ?? "OTA"}${guestName ? ` (${guestName})` : ""} was modified (${attr.arrival_date} → ${attr.departure_date}). Please review room assignments.`;
          await supabase.from("notifications").insert({
            property_id: property.id,
            booking_id: attr.booking_id,
            type: "booking_modified",
            channel: "in_app",
            status: "unread",
            message: notificationMessage,
            sent_at: now,
          });

          return { ok: true };
        }

        // Parent booking not in our DB yet. Treat as transient: retry next cycle.
        return { ok: false, reason: `Modification for unknown booking ${attr.booking_id} — parent not found, will retry`, kind: "transient" };
      }

      console.log(
        `[applyRevision] Flagged modified booking ${attr.booking_id} for review — ` +
        `roomsTotal=${roomsTotal} commission=${commissionAmount ?? "null (no rate)"}`,
      );

      // Roll up total_commission on the property (non-fatal if it fails)
      const propertyId = modified[0].property_id ?? property?.id;
      if (propertyId) {
        await updatePropertyCommission(supabase, propertyId);

        // Write in-app notification for the property owner
        const notificationMessage = `Booking from ${attr.ota_name ?? "OTA"}${guestName ? ` (${guestName})` : ""} was modified (${attr.arrival_date} → ${attr.departure_date}). Please review room assignments.`;
        const { error: notifErr } = await supabase.from("notifications").insert({
          property_id: propertyId,
          booking_id: attr.booking_id,
          type: "booking_modified",
          channel: "in_app",
          status: "unread",
          message: notificationMessage,
          sent_at: now,
        });

        if (notifErr) {
          console.warn(`[applyRevision] Could not insert notification for modified booking ${attr.booking_id}:`, notifErr.message);
        }
      }

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
 * Compute the commission amount given a commission rate and room total.
 * Returns null if rate is missing or roomsTotal is non-positive.
 */
function computeCommission(
  commissionRate: number | null,
  roomsTotal: number,
): number | null {
  if (roomsTotal <= 0 || !commissionRate) return null;
  return parseFloat((roomsTotal * (commissionRate / 100)).toFixed(2));
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
