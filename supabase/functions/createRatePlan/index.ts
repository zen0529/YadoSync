import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { propertyId, roomTypeId, channexPropertyId, channexRoomTypeId, form } = await req.json();

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // Initialize Supabase admin client
    // We need service role to bypass RLS or insert if the user isn't fully authenticated in the function context
    // Actually, edge functions triggered from client have the user's Authorization header.
    // Let's create a client using the auth header from the request so RLS applies.
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    // 1. Create in Channex
    const channexPayload = {
      rate_plan: {
        property_id: channexPropertyId,
        room_type_id: channexRoomTypeId,
        title: form.title,
        currency: form.currency || "PHP",
        sell_mode: form.sell_mode || "per_room",
        rate_mode: form.rate_mode || "manual",
        tax_set_id: form.tax_set_id || null,
        parent_rate_plan_id: form.rate_mode === "derived" ? (form.parent_rate_plan_id || null) : null,
        children_fee: form.children_fee || "0.00",
        infant_fee: form.infant_fee || "0.00",
        max_stay: Array(7).fill(Number(form.max_stay) ?? 0),
        min_stay_arrival: Array(7).fill(Number(form.min_stay_arrival) ?? 1),
        min_stay_through: Array(7).fill(Number(form.min_stay_through) ?? 1),
        closed_to_arrival: Array(7).fill(Boolean(form.closed_to_arrival) ?? false),
        closed_to_departure: Array(7).fill(Boolean(form.closed_to_departure) ?? false),
        stop_sell: Array(7).fill(Boolean(form.stop_sell) ?? false),
        inherit_rate: form.inherit_rate ?? false,
        inherit_closed_to_arrival: form.inherit_closed_to_arrival ?? false,
        inherit_closed_to_departure: form.inherit_closed_to_departure ?? false,
        inherit_stop_sell: form.inherit_stop_sell ?? false,
        inherit_min_stay_arrival: form.inherit_min_stay_arrival ?? false,
        inherit_min_stay_through: form.inherit_min_stay_through ?? false,
        inherit_max_stay: form.inherit_max_stay ?? false,
        inherit_max_sell: form.inherit_max_sell ?? false,
        inherit_max_availability: form.inherit_max_availability ?? false,
        inherit_availability_offset: form.inherit_availability_offset ?? false,
        auto_rate_settings: null,
        options: [{ occupancy: 1, is_primary: true, rate: 0 }],
      },
    };

    const channexRes = await fetch(`${CHANNEX_BASE_URL}/api/v1/rate_plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": channexApiKey,
      },
      body: JSON.stringify(channexPayload),
    });

    if (!channexRes.ok) {
      let errorBody;
      try { errorBody = await channexRes.json(); } catch { /* ignore */ }

      if (channexRes.status === 422 && errorBody?.errors?.details) {
        const fieldMessages = Object.entries(errorBody.errors.details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        throw new Error(`Channex validation error — ${fieldMessages}`);
      }
      throw new Error(errorBody?.errors?.title || `Failed to create rate plan in Channex (${channexRes.status})`);
    }

    const channexData = await channexRes.json();
    const channexRatePlanId = channexData?.data?.id;
    if (!channexRatePlanId) throw new Error("Channex did not return a rate plan ID.");

    try {
      // 2. Insert into Supabase
      const { data: row, error: supabaseError } = await supabase
        .from("rate_plans")
        .insert([{
          property_id: propertyId,
          room_type_id: roomTypeId,
          channex_rate_plan_id: channexRatePlanId,
          title: form.title,
          currency: form.currency || "PHP",
          sell_mode: form.sell_mode || "per_room",
          rate_mode: form.rate_mode || "manual",
          tax_set_id: form.tax_set_id || null,
          parent_rate_plan_id: form.rate_mode === "derived" ? (form.parent_rate_plan_id || null) : null,
          children_fee: form.children_fee || "0.00",
          infant_fee: form.infant_fee || "0.00",
          min_stay_arrival: Number(form.min_stay_arrival) ?? 1,
          min_stay_through: Number(form.min_stay_through) ?? 1,
          max_stay: Number(form.max_stay) ?? 0,
          closed_to_arrival: Boolean(form.closed_to_arrival) ?? false,
          closed_to_departure: Boolean(form.closed_to_departure) ?? false,
          stop_sell: Boolean(form.stop_sell) ?? false,
          inherit_settings: {
            rate: form.inherit_rate ?? false,
            closed_to_arrival: form.inherit_closed_to_arrival ?? false,
            closed_to_departure: form.inherit_closed_to_departure ?? false,
            stop_sell: form.inherit_stop_sell ?? false,
            min_stay_arrival: form.inherit_min_stay_arrival ?? false,
            min_stay_through: form.inherit_min_stay_through ?? false,
            max_stay: form.inherit_max_stay ?? false,
            max_sell: form.inherit_max_sell ?? false,
            max_availability: form.inherit_max_availability ?? false,
            availability_offset: form.inherit_availability_offset ?? false,
          },
          options: [{ occupancy: 1, is_primary: true, rate: 0 }],
          auto_rate_settings: null,
        }])
        .select("*")
        .single();

      if (supabaseError) throw new Error(`Supabase insert failed: ${supabaseError.message}`);

      // Success! Return the created row
      return new Response(JSON.stringify({ row }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      // 3. Rollback: If Supabase fails, delete the record from Channex
      console.warn(`Rolling back Channex rate plan ${channexRatePlanId} due to Supabase error...`);
      try {
        await fetch(`${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "user-api-key": channexApiKey,
          },
        });
      } catch (rollbackError) {
        console.error("Failed to rollback Channex rate plan:", rollbackError);
      }

      throw error; // Re-throw to be caught by outer catch block
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
