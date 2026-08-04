import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { localId, channexRatePlanId, form } = await req.json();

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } },
    );

    // 0. Snapshot the current row so we can roll back Channex if Supabase fails
    const { data: originalRow, error: fetchError } = await supabase
      .from("rate_plans")
      .select("*")
      .eq("id", localId)
      .single();

    if (fetchError)
      throw new Error(
        `Failed to fetch current rate plan for rollback snapshot: ${fetchError.message}`,
      );

    // Build the rollback payload from the snapshot
    const originalOptions = Array.isArray(originalRow.options)
      ? originalRow.options
      : [];
    const rollbackPayload = {
      rate_plan: {
        title: originalRow.title,
        tax_set_id: originalRow.tax_set_id ?? null,
        parent_rate_plan_id: originalRow.parent_rate_plan_id ?? null,
        children_fee: originalRow.children_fee ?? "0.00",
        infant_fee: originalRow.infant_fee ?? "0.00",
        max_stay: originalRow.max_stay ?? 0,
        min_stay_arrival: originalRow.min_stay_arrival ?? 1,
        min_stay_through: originalRow.min_stay_through ?? 1,
        closed_to_arrival: originalRow.closed_to_arrival ?? false,
        closed_to_departure: originalRow.closed_to_departure ?? false,
        stop_sell: originalRow.stop_sell ?? false,
        options: originalOptions,
        currency: originalRow.currency ?? null,
        sell_mode: originalRow.sell_mode ?? "per_room",
        rate_mode: originalRow.rate_mode ?? "manual",
        inherit_rate: originalRow.inherit_settings?.rate ?? false,
        inherit_closed_to_arrival:
          originalRow.inherit_settings?.closed_to_arrival ?? false,
        inherit_closed_to_departure:
          originalRow.inherit_settings?.closed_to_departure ?? false,
        inherit_stop_sell: originalRow.inherit_settings?.stop_sell ?? false,
        inherit_min_stay_arrival:
          originalRow.inherit_settings?.min_stay_arrival ?? false,
        inherit_min_stay_through:
          originalRow.inherit_settings?.min_stay_through ?? false,
        inherit_max_stay: originalRow.inherit_settings?.max_stay ?? false,
        inherit_max_sell: originalRow.inherit_settings?.max_sell ?? false,
        inherit_max_availability:
          originalRow.inherit_settings?.max_availability ?? false,
        inherit_availability_offset:
          originalRow.inherit_settings?.availability_offset ?? false,
        auto_rate_settings: originalRow.auto_rate_settings ?? null,
      },
    };

    // 1. Update in Channex
    const channexPayload = {
      rate_plan: {
        title: form.title,
        tax_set_id: null,
        parent_rate_plan_id: null,
        children_fee: "0.00",
        infant_fee: "0.00",
        max_stay: 0,
        min_stay_arrival: 1,
        min_stay_through: 1,
        closed_to_arrival: false,
        closed_to_departure: false,
        stop_sell: false,
        options: [
          {
            occupancy: form.occupancy,
            is_primary: form.primary,
            rate: form.rate,
          },
        ],
        currency: null,
        sell_mode: "per_room",
        rate_mode: "manual",
        inherit_rate: false,
        inherit_closed_to_arrival: false,
        inherit_closed_to_departure: false,
        inherit_stop_sell: false,
        inherit_min_stay_arrival: false,
        inherit_min_stay_through: false,
        inherit_max_stay: false,
        inherit_max_sell: false,
        inherit_max_availability: false,
        inherit_availability_offset: false,
        auto_rate_settings: null,
      },
    };

    const channexRes = await fetch(
      `${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "user-api-key": channexApiKey,
        },
        body: JSON.stringify(channexPayload),
      },
    );

    if (!channexRes.ok) {
      let errorBody;
      try {
        errorBody = await channexRes.json();
      } catch {
        /* ignore */
      }

      if (channexRes.status === 422 && errorBody?.errors?.details) {
        const fieldMessages = Object.entries(errorBody.errors.details)
          .map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
          )
          .join(" | ");
        throw new Error(`Channex validation error — ${fieldMessages}`);
      }
      throw new Error(
        errorBody?.errors?.title ||
          `Failed to update rate plan in Channex (${channexRes.status})`,
      );
    }

    // 2. Update in Supabase — roll back Channex if this fails
    try {
      const { data: row, error: supabaseError } = await supabase
        .from("rate_plans")
        .update({
          title: form.title,
          tax_set_id: null,
          parent_rate_plan_id: null,
          children_fee: "0.00",
          infant_fee: "0.00",
          max_stay: 0,
          min_stay_arrival: 1,
          min_stay_through: 1,
          closed_to_arrival: false,
          closed_to_departure: false,
          stop_sell: false,
          options: [
            {
              occupancy: form.occupancy,
              is_primary: form.primary,
              rate: form.rate,
            },
          ],
          currency: null,
          sell_mode: "per_room",
          rate_mode: "manual",
          inherit_settings: {
            rate: false,
            closed_to_arrival: false,
            closed_to_departure: false,
            stop_sell: false,
            min_stay_arrival: false,
            min_stay_through: false,
            max_stay: false,
            max_sell: false,
            max_availability: false,
            availability_offset: false,
          },
          auto_rate_settings: null,
        })
        .eq("id", localId)
        .select("*")
        .single();

      if (supabaseError)
        throw new Error(`Supabase update failed: ${supabaseError.message}`);

      return new Response(JSON.stringify({ row }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      // Rollback: re-PUT the original values to Channex so it stays in sync
      console.warn(
        `[updateRatePlan] Supabase update failed — rolling back Channex rate plan ${channexRatePlanId}...`,
      );
      try {
        await fetch(
          `${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "user-api-key": channexApiKey,
            },
            body: JSON.stringify(rollbackPayload),
          },
        );
        console.log(
          `[updateRatePlan] Channex rollback succeeded for rate plan ${channexRatePlanId}`,
        );
      } catch (rollbackError) {
        console.error(
          `[updateRatePlan] Channex rollback failed for rate plan ${channexRatePlanId}:`,
          rollbackError,
        );
      }

      throw error; // Re-throw to be caught by outer handler
    }
  } catch (err) {
    console.error("[updateRatePlan] Error:", err.message);
    return new Response(
      JSON.stringify({
        error:
          "An error occurred while updating the rate plan. Please try again later.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
