/**
 * createChannel/index.ts
 *
 * Step 3 of the OTA channel wizard.
 * Creates the channel in Channex with the user's room/rate mapping,
 * activates it, then dual-writes to Supabase platform_connection.
 *
 * Request body:
 *   {
 *     property_id: "local-uuid",
 *     platform: "booking",
 *     hotel_id: "12345",
 *     group_id: "channex-group-uuid",     // from getChannelMappingDetails
 *     channex_property_id: "channex-uuid",
 *     rate_plan_mappings: [
 *       {
 *         rate_plan_id: "local-rate-plan-uuid",   // YadoSync rate plan
 *         channex_rate_plan_id: "channex-rp-uuid",
 *         room_type_code: 12345,                  // OTA integer code
 *         rate_plan_code: 67890,                  // OTA integer code
 *         pricing_type: "OBP",                    // "OBP" | "PP"
 *         occupancy: 2                            // primary occupancy
 *       }
 *     ]
 *   }
 *
 * Response (success):
 *   { channex_channel_id: "uuid" }
 *
 * Flow:
 *   1. POST /channels  → get channel UUID
 *   2. POST /channels/:id/activate
 *   3. Upsert platform_connection in Supabase
 *   If Supabase upsert fails → deactivate + delete channel (rollback)
 *
 * TRAP: room_type_code and rate_plan_code MUST be integers.
 * TRAP: channels are created inactive — activate is a separate call.
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
    const {
      property_id,
      channel,
      platform,
      hotel_id,
      group_id,
      channex_property_id,
      rate_plan_mappings,
    } = await req.json();

    const targetChannel = channel || platform;

    if (!property_id || !targetChannel || !hotel_id || !group_id || !channex_property_id || !rate_plan_mappings?.length) {
      throw new Error("property_id, channel, hotel_id, group_id, channex_property_id and rate_plan_mappings are required");
    }

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // ── 1. Build rate_plans mapping array ─────────────────────────────────
    // Codes are INTEGERS — Channex confirmed trap.
    // UI <select> values are strings; the edge function does the cast so the
    // caller doesn't have to worry about it.
    const channexRatePlans = rate_plan_mappings.map((m: any) => ({
      rate_plan_id: m.channex_rate_plan_id || m.rate_plan_id,
      settings: {
        room_type_code: Number(m.room_type_code),   // integer
        rate_plan_code: Number(m.rate_plan_code),    // integer
        pricing_type:   m.pricing_type ?? "OBP",
        occupancy:      Number(m.occupancy) || 1,
        primary_occ:    typeof m.primary_occ === "boolean" ? m.primary_occ : true,
        readonly:       Boolean(m.readonly ?? false),
      },
    }));

    // ── 2. POST /channels ─────────────────────────────────────────────────
    const channelPayload = {
      channel: {
        channel: targetChannel,       // "BookingCom"
        group_id,
        title: `${targetChannel} connection`,
        properties: [channex_property_id],
        settings: { hotel_id },
        rate_plans: channexRatePlans,
      },
    };

    const channelData = await channexPost(
      "/channels",
      channelPayload,
      channexApiKey,
      CHANNEX_BASE_URL,
    ) as any;

    const channexChannelId: string = channelData?.id ?? channelData?.attributes?.id;
    if (!channexChannelId) throw new Error("Channex did not return a channel ID");

    console.log(`[createChannel] Created Channex channel ${channexChannelId} for channel=${targetChannel}`);

    // ── 3. Activate the channel ───────────────────────────────────────────
    // Channels are created inactive — must call activate to go live.
    try {
      await channexPost(
        `/channels/${channexChannelId}/activate`,
        {},
        channexApiKey,
        CHANNEX_BASE_URL,
      );
      console.log(`[createChannel] Activated channel ${channexChannelId}`);
    } catch (activateErr: any) {
      // Activation failure is non-fatal in terms of data integrity,
      // but we should clean up and let the user retry.
      console.error(`[createChannel] Activate failed: ${activateErr.message} — rolling back channel`);
      try {
        await channexPost(`/channels/${channexChannelId}/deactivate`, {}, channexApiKey, CHANNEX_BASE_URL);
      } catch { /* ignore */ }
      try {
        await fetch(`${CHANNEX_BASE_URL}/api/v1/channels/${channexChannelId}`, {
          method: "DELETE",
          headers: { "user-api-key": channexApiKey },
        });
      } catch { /* ignore */ }
      throw new Error(`Channel created but activation failed: ${activateErr.message}`);
    }

    // ── 4. Upsert Supabase platform_connection ────────────────────────────
    // Use service role to bypass RLS (this is a server-side write).
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    try {
      const { error: upsertError } = await supabaseAdmin
        .from("platform_connections")
        .upsert(
          {
            property_id,
            platform:            targetChannel,
            channex_channel_id:  channexChannelId,
            channex_group_id:    group_id,
            ota_hotel_id:        hotel_id,
            mapping_payload:     rate_plan_mappings,
            connection_status:   "connected",
            connected_at:        new Date().toISOString(),
          },
          { onConflict: "property_id,platform" },
        );

      if (upsertError) throw new Error(`Supabase upsert failed: ${upsertError.message}`);
    } catch (supabaseErr: any) {
      // Rollback: deactivate then delete the Channex channel
      console.error(`[createChannel] Supabase write failed — rolling back Channex channel ${channexChannelId}`);
      try {
        await channexPost(`/channels/${channexChannelId}/deactivate`, {}, channexApiKey, CHANNEX_BASE_URL);
      } catch { /* ignore */ }
      try {
        await fetch(`${CHANNEX_BASE_URL}/api/v1/channels/${channexChannelId}`, {
          method: "DELETE",
          headers: { "user-api-key": channexApiKey },
        });
      } catch { /* ignore */ }
      throw supabaseErr;
    }

    return new Response(JSON.stringify({ channex_channel_id: channexChannelId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[createChannel]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
