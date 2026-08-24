/**
 * channex-webhook — Edge Function
 *
 * HTTP endpoint that Channex calls when a booking event fires.
 * Registered once via POST /webhooks (or the registerWebhook function).
 *
 * Flow:
 *   POST /channex-webhook
 *   Body: { event, payload: { revision_id, booking_id, property_id }, ... }
 *
 *   1. Extract revision_id from payload
 *   2. GET /booking_revisions/:revision_id  (pull authoritative details)
 *   3. applyRevision(revision)
 *   4. if ok  → POST /booking_revisions/:id/ack → return 200
 *   5. if err → return 500 so Channex retries the webhook delivery
 *
 * Note: This function is intentionally public (no JWT check). Security
 * relies on the fact that we always pull the revision from Channex
 * by ID rather than trusting the webhook payload content directly.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  channexGet,
  channexPostRaw,
  type BookingRevision,
} from "../_shared/channex.ts";
import { applyRevision } from "../_shared/bookings.ts";

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

  try {
    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── 1. Parse webhook body ────────────────────────────────────────────────
    let webhookBody: {
      event?: string;
      payload?: { revision_id?: string; booking_id?: string; property_id?: string };
      timestamp?: string;
    };

    try {
      webhookBody = await req.json();
    } catch {
      console.error("[channex-webhook] Failed to parse request body");
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const revisionId = webhookBody?.payload?.revision_id;
    const event = webhookBody?.event ?? "unknown";

    console.log(`[channex-webhook] Received event=${event} revision_id=${revisionId}`);

    if (!revisionId) {
      // Channex sent a webhook without a revision_id — acknowledge it and move on
      console.warn("[channex-webhook] No revision_id in payload, ignoring");
      return new Response(
        JSON.stringify({ ok: true, message: "No revision_id — ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Fetch the authoritative revision from Channex ─────────────────────
    // We pull from Channex rather than using inline payload data so we always
    // have the full, verified revision shape — not just what the webhook says.
    const revision = await channexGet(
      `/booking_revisions/${revisionId}`,
      channexApiKey,
      CHANNEX_BASE_URL,
    ) as BookingRevision;

    // ── 3. Apply to Supabase ─────────────────────────────────────────────────
    const result = await applyRevision(revision, supabase);

    if (!result.ok) {
      // Apply failed — return 500 so Channex retries the webhook
      console.error(`[channex-webhook] Apply failed for revision ${revisionId}:`, result.reason);
      return new Response(
        JSON.stringify({ error: result.reason }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── 4. Ack the revision ──────────────────────────────────────────────────
    try {
      await channexPostRaw(
        `/booking_revisions/${revisionId}/ack`,
        {},
        channexApiKey,
        CHANNEX_BASE_URL,
      );
      console.log(`[channex-webhook] Acked revision ${revisionId}`);
    } catch (ackErr: any) {
      // Ack failed — apply succeeded so the booking is in Supabase.
      // The revision will re-surface in the feed poller in 30 minutes
      // and the duplicate upsert will be a no-op.
      console.warn(`[channex-webhook] Ack failed for ${revisionId}:`, ackErr.message);
    }

    return new Response(
      JSON.stringify({ ok: true, event, revisionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err: any) {
    console.error("[channex-webhook] Fatal error:", err.message);
    // Return 500 so Channex retries the webhook delivery
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
