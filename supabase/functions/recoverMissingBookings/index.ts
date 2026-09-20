/**
 * recoverMissingBookings — Edge Function
 *
 * Single responsibility: One-shot manual recovery for bookings that fell out
 * of the 30-minute Channex feed window during an outage or processing failure.
 *
 * Triggered exclusively by the superadmin (or service role) — never on a cron.
 *
 * Algorithm:
 *   1. Auth guard: require superadmin role or service role key
 *   2. Query revision_failures for unresolved failures older than 30 minutes
 *      (or use custom `from_ts` from body if provided)
 *   3. If no expired failures and no `from_ts` → return early with { recovered: 0 }
 *   4. Fetch bookings from Channex: GET /bookings?filter[inserted_at][gte]=<window_start>
 *      (drain all pages)
 *   5. Identify missing bookings: present in Channex but absent in Supabase `bookings`
 *   6. Apply each missing booking using applyRevision()
 *   7. Mark corresponding revision_failures as resolved
 *   8. Log recovery attempt to sync_logs
 *   9. Return detailed summary
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  channexGetWithMeta,
  type BookingRevision,
  type BookingRoom,
} from "../_shared/channex.ts";
import { applyRevision } from "../_shared/bookingsPage/applyRevision.ts";
import { markRevisionRecoveredByBookingId } from "../_shared/bookings.ts";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL") ?? "https://staging.channex.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RecoveryRequestBody {
  from_ts?: string;
  dry_run?: boolean;
}

interface ChannexBookingItem {
  id: string;
  type: string;
  attributes: {
    id?: string;
    booking_id?: string;
    property_id?: string;
    status?: string;
    ota_name?: string;
    ota_reservation_code?: string;
    system_id?: string;
    rooms?: BookingRoom[];
    services?: unknown[];
    customer?: {
      name?: string;
      surname?: string;
      mail?: string;
      phone?: string;
    };
    arrival_date?: string;
    departure_date?: string;
    arrival_hour?: string;
    amount?: string;
    currency?: string;
    notes?: string;
    inserted_at?: string;
    [key: string]: unknown;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const channexApiKey = Deno.env.get("CHANNEX_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[recoverMissingBookings] Missing Supabase environment variables");
    return new Response(
      JSON.stringify({ error: "Server configuration error. Please contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!channexApiKey) {
    console.error("[recoverMissingBookings] CHANNEX_API_KEY secret not set");
    return new Response(
      JSON.stringify({ error: "Channex integration is not configured." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── Step 1: Auth Guard ──────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const isServiceRole = token === supabaseServiceKey;

  if (!isServiceRole) {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "superadmin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized. This action is restricted to superadministrators." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  try {
    const body: RecoveryRequestBody = await req.json().catch(() => ({}));
    const dryRun = Boolean(body.dry_run);

    // ── Step 2: Query unresolved failures older than 30 min ──────────────────
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1_000).toISOString();

    const { data: expiredFailures, error: failQueryError } = await supabase
      .from("revision_failures")
      .select("booking_id, first_failed_at")
      .eq("resolved", false)
      .lt("first_failed_at", thirtyMinAgo)
      .order("first_failed_at", { ascending: true });

    if (failQueryError) {
      console.error("[recoverMissingBookings] Failed to query revision_failures:", failQueryError);
    }

    const hasExpiredFailures = (expiredFailures ?? []).length > 0;

    if (!hasExpiredFailures && !body.from_ts) {
      return new Response(
        JSON.stringify({
          ok: true,
          recovered: 0,
          failed: 0,
          skipped: 0,
          dry_run: dryRun,
          window_start: null,
          message: "No expired revision failures found needing recovery.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Determine window_start: custom timestamp or earliest failure
    const windowStart =
      body.from_ts ||
      (hasExpiredFailures ? expiredFailures![0].first_failed_at : thirtyMinAgo);

    console.log(
      `[recoverMissingBookings] Starting recovery. window_start=${windowStart}, dry_run=${dryRun}, expired_failures_count=${expiredFailures?.length ?? 0}`,
    );

    // ── Step 3: Drain all Channex bookings within the window ─────────────────
    const allChannexBookings: ChannexBookingItem[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const queryParams = new URLSearchParams({
        "filter[inserted_at][gte]": windowStart,
        page: String(page),
        limit: String(limit),
      });

      const { data, meta } = (await channexGetWithMeta(
        `/bookings?${queryParams.toString()}`,
        channexApiKey,
        CHANNEX_BASE_URL,
        { maxAttempts: 3 },
      )) as { data: ChannexBookingItem[]; meta: { total?: number; limit?: number; page?: number } };

      const items = data ?? [];
      allChannexBookings.push(...items);

      const total = meta?.total ?? 0;
      if (items.length === 0 || page * limit >= total) {
        break;
      }
      page++;
    }

    console.log(
      `[recoverMissingBookings] Fetched ${allChannexBookings.length} total bookings from Channex since ${windowStart}`,
    );

    // ── Step 4: Compare with existing bookings in Supabase ────────────────────
    const bookingIds = allChannexBookings
      .map((b) => b.attributes?.booking_id || b.attributes?.id || b.id)
      .filter(Boolean);

    const existingIdSet = new Set<string>();

    // Chunk lookup by 200 to stay well within query limits
    for (let i = 0; i < bookingIds.length; i += 200) {
      const chunk = bookingIds.slice(i, i + 200);
      const { data: existingRows, error: lookupErr } = await supabase
        .from("bookings")
        .select("channex_booking_id")
        .in("channex_booking_id", chunk);

      if (lookupErr) {
        console.error("[recoverMissingBookings] Error looking up existing bookings:", lookupErr);
      } else {
        (existingRows ?? []).forEach((r: { channex_booking_id: string }) =>
          existingIdSet.add(r.channex_booking_id),
        );
      }
    }

    // Resolve any failures for bookings that already exist in Supabase
    for (const bId of bookingIds) {
      if (existingIdSet.has(bId)) {
        await markRevisionRecoveredByBookingId(supabase, bId);
      }
    }

    // Identify missing bookings
    const missingBookings = allChannexBookings.filter((b) => {
      const bId = b.attributes?.booking_id || b.attributes?.id || b.id;
      return bId && !existingIdSet.has(bId);
    });

    console.log(
      `[recoverMissingBookings] Found ${missingBookings.length} missing bookings to recover (out of ${allChannexBookings.length} total)`,
    );

    let recovered = 0;
    let failed = 0;
    const skipped = allChannexBookings.length - missingBookings.length;
    const errors: string[] = [];

    // ── Step 5: Apply each missing booking ────────────────────────────────────
    for (const item of missingBookings) {
      const attr = item.attributes;
      const bId = attr?.booking_id || attr?.id || item.id;

      if (dryRun) {
        console.log(`[recoverMissingBookings] [DRY RUN] Would recover booking ${bId} (${attr?.ota_name})`);
        recovered++;
        continue;
      }

      // Construct a synthetic BookingRevision payload compatible with applyRevision
      const rawStatus = (attr?.status ?? "new").toLowerCase();
      const normalizedStatus = rawStatus === "cancelled" ? "cancellation" : rawStatus;

      const revisionId = (attr as any)?.revision_id || attr?.id || item.id;

      const syntheticRevision: BookingRevision = {
        id: revisionId,
        type: "booking_revision",
        attributes: {
          id: revisionId,
          booking_id: bId,
          property_id: attr?.property_id ?? "",
          status: normalizedStatus,
          ota_name: attr?.ota_name ?? "",
          ota_reservation_code: attr?.ota_reservation_code ?? "",
          system_id: attr?.system_id ?? "",
          rooms: attr?.rooms ?? [],
          services: attr?.services ?? [],
          customer: attr?.customer ?? {},
          arrival_date: attr?.arrival_date ?? "",
          departure_date: attr?.departure_date ?? "",
          arrival_hour: attr?.arrival_hour,
          amount: attr?.amount ?? "0",
          currency: attr?.currency ?? "USD",
          notes: attr?.notes,
          inserted_at: attr?.inserted_at ?? new Date().toISOString(),
        },
      };

      const result = await applyRevision(syntheticRevision, supabase, { createIfMissing: true });

      if (result.ok) {
        recovered++;
        await markRevisionRecoveredByBookingId(supabase, bId);
      } else {
        failed++;
        console.error(`[recoverMissingBookings] Failed to apply missing booking ${bId}:`, result.reason);
        errors.push(`Booking ${bId}: ${result.reason}`);
      }
    }

    // ── Step 6: Log recovery attempt to sync_logs ─────────────────────────────
    const logStatus = failed > 0 ? (recovered > 0 ? "partial" : "failed") : "ok";
    const logMessage = `Booking recovery completed: ${recovered} recovered, ${failed} failed, ${skipped} already existed (dry_run: ${dryRun})`;

    const { error: syncLogError } = await supabase.from("sync_logs").insert({
      type: "booking_recovery",
      status: logStatus,
      platform: "channex",
      message: logMessage,
      payload: {
        recovered,
        failed,
        skipped,
        dry_run: dryRun,
        window_start: windowStart,
        errors,
      },
      synced_at: new Date().toISOString(),
    });

    if (syncLogError) {
      console.error("[recoverMissingBookings] Failed to write to sync_logs:", syncLogError);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        recovered,
        failed,
        skipped,
        dry_run: dryRun,
        window_start: windowStart,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err: any) {
    console.error("[recoverMissingBookings] Unexpected fatal error:", err);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred during booking recovery. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
