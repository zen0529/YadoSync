/**
 * pollBookingFeed — Edge Function
 *
 * Drains all unacknowledged Channex booking revisions and applies them
 * to the Supabase `bookings` table.
 *
 * Called by:
 *   1. pg_cron every minute (body: { source: "cron" })
 *   2. Manually for testing (body: { source: "manual" })
 *
 * Algorithm:
 *   loop:
 *     GET /booking_revisions/feed
 *     for each revision:
 *       applyRevision(revision)       ← write to Supabase
 *       if apply succeeded → POST /booking_revisions/:id/ack
 *       if apply failed    → leave un-acked (re-surfaces in 30 min), log error
 *     if feed is exhausted → break
 *     else → loop again (drain)
 *
 * Returns: { applied: N, failed: N, acked: N, errors: string[], source }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  channexGetWithMeta,
  channexPostRaw,
  type BookingRevision,
  type BookingRevisionFeed,
  type BookingRevisionFeedMeta,
} from "../_shared/channex.ts";
import { applyRevision } from "../_shared/bookingsPage/applyRevision.ts";
import { upsertRevisionFailure, markRevisionResolved } from "../_shared/bookings.ts";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL") ?? "https://staging.channex.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const errors: string[] = [];
  let applied   = 0;
  let failed    = 0;
  let permanent = 0;   // failures that need human intervention
  let acked     = 0;

  /** 30-minute Channex feed expiry window in milliseconds */
  const THIRTY_MINUTES_MS = 30 * 60 * 1_000;

  try {
    const body = await req.json().catch(() => ({}));
    const { source = "manual" } = body as { source?: string };

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── Drain the feed ────────────────────────────────────────────────────
    // Loop until Channex reports no more unacknowledged revisions.
    // Each page returns up to the default limit; we keep going until
    // meta.total reaches 0 (feed is empty).

    let page = 1;
    let totalDrained = 0;

    drainLoop: while (true) {
      const { data, meta } = await channexGetWithMeta(
        `/booking_revisions/feed?page=${page}`,
        channexApiKey,
        CHANNEX_BASE_URL,
        { maxAttempts: 1 }, // cron retries naturally every minute — no in-function backoff needed
      ) as { data: BookingRevision[]; meta: BookingRevisionFeedMeta };

      const revisions = data ?? [];

      if (revisions.length === 0) {
        // Feed is empty — done
        break drainLoop;
      }

      console.log(
        `[pollBookingFeed] source=${source} page=${page} revisions=${revisions.length} total=${meta?.total ?? "?"}`,
      );

      for (const revision of revisions) {
        const revId = revision.id;

        // Apply to Supabase
        const result = await applyRevision(revision, supabase);

        if (result.ok) {
          // ── Success: ack + mark any prior failure record as resolved ─────
          // markRevisionResolved is a no-op when no failure record exists.
          await markRevisionResolved(supabase, revId);

          try {
            await channexPostRaw(
              `/booking_revisions/${revId}/ack`,
              {},
              channexApiKey,
              CHANNEX_BASE_URL,
            );
            applied++;
            acked++;
          } catch (ackErr: any) {
            // Apply succeeded but ack failed — the revision will re-surface
            // in 30 minutes. Log it but don't count as a failed apply.
            errors.push(`Ack failed for revision ${revId}: ${ackErr.message}`);
            applied++;
          }
        } else {
          // ── Failure: record it and route by kind ─────────────────────────
          const { first_failed_at } = await upsertRevisionFailure(
            supabase,
            revId,
            revision.attributes?.booking_id ?? null,
            result.reason,
            result.kind,
          );

          const ageMs = Date.now() - new Date(first_failed_at).getTime();
          const windowExpired = ageMs > THIRTY_MINUTES_MS;

          if (result.kind === "permanent" || windowExpired) {
            // Permanent error OR the revision has been retrying for > 30 min
            // and has likely fallen out of the Channex feed.
            // Alert loudly — a human must intervene.
            permanent++;
            const alertReason = windowExpired
              ? `30-min window expired after ${Math.round(ageMs / 60_000)} min: ${result.reason}`
              : result.reason;
            console.error(
              `[pollBookingFeed] PERMANENT failure for revision ${revId} (booking ${revision.attributes?.booking_id}):`,
              alertReason,
            );
            errors.push(`[PERMANENT] Revision ${revId}: ${alertReason}`);
            // TODO Phase 2: write to sync_logs + trigger superadmin alert
          } else {
            // Transient error within the 30-min window — leave un-acked.
            // The revision will re-surface on the next poll cycle (every 1 min).
            console.warn(
              `[pollBookingFeed] Transient failure for revision ${revId}, will retry. Reason: ${result.reason}`,
            );
            errors.push(`[TRANSIENT] Revision ${revId}: ${result.reason}`);
          }

          failed++;
        }

        totalDrained++;
      }

      // Check if there are more pages
      const feedMeta = meta as BookingRevisionFeedMeta;
      const hasMore = feedMeta?.total > feedMeta?.limit * page;
      if (!hasMore) break drainLoop;
      page++;
    }

    console.log(
      `[pollBookingFeed] source=${source} applied=${applied} failed=${failed} permanent=${permanent} acked=${acked} errors=${errors.length}`,
    );

    return new Response(
      JSON.stringify({ applied, failed, permanent, acked, errors, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err: any) {
    console.error("[pollBookingFeed] Fatal error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message, applied, failed, acked, errors }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
