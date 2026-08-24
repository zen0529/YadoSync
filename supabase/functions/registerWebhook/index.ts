/**
 * registerWebhook — Edge Function
 *
 * One-shot function to register the channex-webhook endpoint with Channex.
 * Call this ONCE after deploying channex-webhook.
 *
 * Usage:
 *   supabase functions invoke registerWebhook --no-verify-jwt
 *
 * Or via curl:
 *   curl -X POST https://<project>.supabase.co/functions/v1/registerWebhook \
 *     -H "Authorization: Bearer <service-role-key>"
 *
 * Returns the created webhook ID — save it if you need to update/delete later.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { channexPost } from "../_shared/channex.ts";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL not set");

    // The public URL of the channex-webhook edge function
    const callbackUrl = `${supabaseUrl}/functions/v1/channex-webhook`;

    console.log(`[registerWebhook] Registering webhook → ${callbackUrl}`);

    const result = await channexPost(
      "/webhooks",
      {
        webhook: {
          callback_url: callbackUrl,
          // Subscribe to all three booking event types
          event_mask:   "booking_new;booking_modification;booking_cancellation",
          property_id:  null,   // null = account-wide (all properties)
          is_active:    true,
          send_data:    false,  // receive minimal event; we pull full revision by id
        },
      },
      channexApiKey,
      CHANNEX_BASE_URL,
    ) as { id?: string };

    const webhookId = (result as any)?.id ?? "unknown";
    console.log(`[registerWebhook] Webhook registered. id=${webhookId}`);

    return new Response(
      JSON.stringify({
        ok: true,
        webhookId,
        callbackUrl,
        message: "Webhook registered. Save the webhookId if you need to update or delete it later.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err: any) {
    console.error("[registerWebhook] Failed:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
