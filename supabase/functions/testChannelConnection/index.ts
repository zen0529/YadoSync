/**
 * testChannelConnection/index.ts
 *
 * Step 1 of the OTA channel wizard.
 * Tests OTA credentials (hotel_id) against Channex before the user proceeds
 * to room/rate mapping. A 422 "no access" here means the Channex account
 * doesn't have Channel API access (Whitelabel tier required).
 *
 * Request body:
 *   { platform: "booking", hotel_id: "12345", property_id: "local-uuid" }
 *
 * Response (success):
 *   { success: true }
 *
 * Response (failure):
 *   { error: "..." }  with HTTP 400
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const { channel, platform, hotel_id } = await req.json();
    const targetChannel = channel || platform;

    if (!targetChannel || !hotel_id) {
      throw new Error("channel and hotel_id are required");
    }

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // POST /channels/test_connection
    // Returns 200 + { data: { ... } } on success.
    // Returns 422 with details if credentials are wrong or if the account
    // doesn't have Channel API access.
    await channexPost(
      "/channels/test_connection",
      { channel: targetChannel, settings: { hotel_id } },
      channexApiKey,
      CHANNEX_BASE_URL,
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[testChannelConnection]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
