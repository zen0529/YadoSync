import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { localId, channexRatePlanId } = await req.json();

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    // 1. Delete from Channex
    const channexRes = await fetch(`${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": channexApiKey,
      },
    });

    if (!channexRes.ok) {
      let errorBody;
      try { errorBody = await channexRes.json(); } catch { /* ignore */ }
      throw new Error(errorBody?.errors?.title || `Failed to delete rate plan in Channex (${channexRes.status})`);
    }

    // 2. Delete from Supabase
    const { error: supabaseError } = await supabase
      .from("rate_plans")
      .delete()
      .eq("id", localId);

    if (supabaseError) {
      // No rollback is currently implemented for rate plans as per existing logic, but we report the error.
      throw new Error(`Supabase delete failed: ${supabaseError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
