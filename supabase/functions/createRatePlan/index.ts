import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  channexPost,
  filterPastDates,
  compressRestrictions,
  dateRange,
  todayUTC,
} from "../_shared/channex.ts";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL");
const PUSH_DAYS = 365;

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
    const {
      propertyId,
      roomTypeId,
      channexPropertyId,
      channexRoomTypeId,
      form,
    } = await req.json();

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
      { global: { headers: { Authorization: authHeader || "" } } },
    );

    // 1. Create in Channex
    const channexPayload = {
      rate_plan: {
        property_id: channexPropertyId,
        room_type_id: channexRoomTypeId,
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
          `Failed to create rate plan in Channex (${channexRes.status})`,
      );
    }

    const channexData = await channexRes.json();
    const channexRatePlanId = channexData?.data?.id;
    if (!channexRatePlanId)
      throw new Error("Channex did not return a rate plan ID.");

    try {
      // 2. Insert into Supabase
      const { data: row, error: supabaseError } = await supabase
        .from("rate_plans")
        .insert([
          {
            property_id: propertyId,
            room_type_id: roomTypeId,
            channex_rate_plan_id: channexRatePlanId,
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
          },
        ])
        .select("*")
        .single();

      if (supabaseError)
        throw new Error(`Supabase insert failed: ${supabaseError.message}`);

      // ── 3. Initial restrictions push (fire-and-forget) ─────────────────
      // Push rate=0 for the next 365 days so the rate plan registers on
      // Channex and OTAs see a valid (if zero) price slot. The property owner
      // sets real prices via the ARI editor. Failure is non-fatal.
      try {
        const today = todayUTC();
        const dates = dateRange(today, PUSH_DAYS);
        const sellMode: string = form.sell_mode || "per_room";
        const entries = filterPastDates(
          dates.map((d) => ({
            date: d,
            rate: 0,
            min_stay_arrival: Number(form.min_stay_arrival) || 1,
            stop_sell: Boolean(form.stop_sell) || false,
            closed_to_arrival: Boolean(form.closed_to_arrival) || false,
            closed_to_departure: Boolean(form.closed_to_departure) || false,
          })),
        );
        const ranges = compressRestrictions(entries);

        const channexRestValues = ranges.map((r) => {
          const v: Record<string, unknown> = {
            property_id: channexPropertyId,
            rate_plan_id: channexRatePlanId,
            date_from: r.date_from,
            date_to: r.date_to,
          };
          if (sellMode === "per_person") {
            v.rates = [{ occupancy: 1, rate: 0 }];
          } else {
            v.rate = r.rate ?? 0;
          }
          if (r.min_stay_arrival !== undefined)
            v.min_stay_arrival = r.min_stay_arrival;
          if (r.stop_sell !== undefined) v.stop_sell = r.stop_sell;
          if (r.closed_to_arrival !== undefined)
            v.closed_to_arrival = r.closed_to_arrival;
          if (r.closed_to_departure !== undefined)
            v.closed_to_departure = r.closed_to_departure;
          return v;
        });

        await channexPost(
          "/restrictions",
          { values: channexRestValues },
          channexApiKey,
          CHANNEX_BASE_URL,
        );

        // Mirror to restrictions table
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        const restUpsertRows = entries.map((v) => ({
          property_id: propertyId,
          rate_plan_id: row.id,
          date: v.date,
          rate: v.rate,
          min_stay_arrival: v.min_stay_arrival,
          stop_sell: v.stop_sell,
          closed_to_arrival: v.closed_to_arrival,
          closed_to_departure: v.closed_to_departure,
          updated_at: new Date().toISOString(),
        }));
        await supabaseAdmin
          .from("restrictions")
          .upsert(restUpsertRows, { onConflict: "rate_plan_id,date" });

        console.log(
          `[createRatePlan] Pushed ${entries.length} restriction rows (${ranges.length} ranges) for rate plan ${channexRatePlanId}`,
        );
      } catch (pushErr: any) {
        console.warn(
          `[createRatePlan] Initial restrictions push failed (non-fatal): ${pushErr.message}`,
        );
      }

      // Success! Return the created row
      return new Response(JSON.stringify({ row }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      // 3. Rollback: If Supabase fails, delete the record from Channex
      console.warn(
        `Rolling back Channex rate plan ${channexRatePlanId} due to Supabase error...`,
      );
      try {
        await fetch(
          `${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "user-api-key": channexApiKey,
            },
          },
        );
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
