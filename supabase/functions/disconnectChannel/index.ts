/**
 * disconnectChannel/index.ts
 *
 * Disconnects an OTA channel:
 *   1. Looks up channex_channel_id from platform_connection
 *   2. POST /channels/:id/deactivate   (required before delete)
 *   3. DELETE /channels/:id
 *   4. Clears channex_channel_id in Supabase, sets connection_status = "disconnected"
 *
 * Request body:
 *   { property_id: "local-uuid", platform: "booking" }
 *
 * TRAP: DELETE /channels/:id returns 422 { "channel": ["is active"] }
 * if the channel is still active. Always deactivate first.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { channexPost } from "../_shared/channex.ts";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { property_id, platform } = await req.json();

    if (!property_id || !platform) {
      throw new Error("property_id and platform are required");
    }

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── 1. Look up the Channex channel ID ─────────────────────────────────
    const { data: row, error: lookupError } = await supabaseAdmin
      .from("platform_connections")
      .select("id, channex_channel_id, connection_status")
      .eq("property_id", property_id)
      .eq("platform", platform)
      .maybeSingle();

    if (lookupError) throw new Error(`Lookup failed: ${lookupError.message}`);
    if (!row) throw new Error(`No platform_connection found for ${platform}`);

    const channexChannelId: string | null = row.channex_channel_id;

    // ── 2. Deactivate + delete from Channex (if channel exists) ──────────
    if (channexChannelId) {
      // Deactivate first — DELETE returns 422 if channel is still active
      try {
        await channexPost(
          `/channels/${channexChannelId}/deactivate`,
          {},
          channexApiKey,
          CHANNEX_BASE_URL,
        );
        console.log(`[disconnectChannel] Deactivated channel ${channexChannelId}`);
      } catch (deactivateErr: any) {
        // If already inactive, Channex may 422 — that's fine, proceed to delete
        console.warn(`[disconnectChannel] Deactivate returned error (may be already inactive): ${deactivateErr.message}`);
      }

      try {
        const deleteRes = await fetch(
          `${CHANNEX_BASE_URL}/api/v1/channels/${channexChannelId}`,
          {
            method: "DELETE",
            headers: { "user-api-key": channexApiKey },
          },
        );
        if (!deleteRes.ok && deleteRes.status !== 404) {
          const errBody = await deleteRes.json().catch(() => ({}));
          throw new Error(errBody?.errors?.title ?? `DELETE /channels failed (${deleteRes.status})`);
        }
        console.log(`[disconnectChannel] Deleted channel ${channexChannelId}`);
      } catch (deleteErr: any) {
        // Non-fatal — we still clear Supabase so the UI reflects disconnected.
        // A stale Channex channel without a local mapping is harmless.
        console.error(`[disconnectChannel] DELETE failed (non-fatal): ${deleteErr.message}`);
      }
    } else {
      console.warn(`[disconnectChannel] No channex_channel_id found for ${platform} — clearing Supabase row only`);
    }

    // ── 3. Update Supabase ─────────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from("platform_connections")
      .update({
        connection_status:  "disconnected",
        channex_channel_id: null,
        channex_group_id:   null,
        ota_hotel_id:       null,
        mapping_payload:    null,
        connected_at:       null,
      })
      .eq("id", row.id);

    if (updateError) throw new Error(`Supabase update failed: ${updateError.message}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[disconnectChannel]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
