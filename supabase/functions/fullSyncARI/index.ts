/**
 * fullSyncARI — Edge Function
 *
 * Full-property ARI drift-correction push.
 *
 * Called by:
 *   1. The pg_cron job every hour (body: { source: "cron" })
 *   2. The "Sync Now" button in the UI (body: { source: "manual", propertyId })
 *
 * When called from cron: syncs ALL properties visible to the service key.
 * When called manually with a propertyId: syncs only that property.
 *
 * For each room type  → pushes count_of_rooms availability for next 365 days
 * For each rate plan  → reads restrictions table rows for future dates,
 *                       pushes them to Channex (or pushes rate=0 if none exist)
 *
 * Returns: { properties: N, roomTypes: N, ratePlans: N, errors: string[] }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  channexPost,
  filterPastDates,
  compressAvailability,
  compressRestrictions,
  dateRange,
  todayUTC,
  type AvailabilityEntry,
  type RestrictionEntry,
} from "../_shared/channex.ts";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL");
const PUSH_DAYS = 365;

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
  let roomTypeCount = 0;
  let ratePlanCount = 0;

  try {
    const body = await req.json().catch(() => ({}));
    const { source = "manual", propertyId: targetPropertyId } = body as {
      source?: string;
      propertyId?: string;
    };

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // Always use service role for full sync
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── 1. Load properties ────────────────────────────────────────────────
    let propertiesQuery = supabase
      .from("properties")
      .select("id, channex_property_id")
      .not("channex_property_id", "is", null);

    if (targetPropertyId) {
      propertiesQuery = propertiesQuery.eq("id", targetPropertyId);
    }

    const { data: properties, error: propError } = await propertiesQuery;
    if (propError)
      throw new Error(`Failed to load properties: ${propError.message}`);
    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({
          properties: 0,
          roomTypes: 0,
          ratePlans: 0,
          errors,
          source,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = todayUTC();

    for (const property of properties) {
      const { id: propertyId, channex_property_id: channexPropertyId } =
        property;

      // ── 2. Push availability for all room types ─────────────────────────
      const { data: roomTypes, error: rtError } = await supabase
        .from("room_types")
        .select("id, channex_room_type_id, count_of_rooms")
        .eq("property_id", propertyId)
        .not("channex_room_type_id", "is", null);

      if (rtError) {
        errors.push(
          `[${propertyId}] Failed to load room types: ${rtError.message}`,
        );
        continue;
      }

      for (const rt of roomTypes ?? []) {
        try {
          const dates = dateRange(today, PUSH_DAYS);
          const entries: AvailabilityEntry[] = dates.map((d) => ({
            date: d,
            available: rt.count_of_rooms ?? 0,
          }));
          const filtered = filterPastDates(entries);
          const ranges = compressAvailability(filtered);

          const channexValues = ranges.map((r) => ({
            property_id: channexPropertyId,
            room_type_id: rt.channex_room_type_id,
            date_from: r.date_from,
            date_to: r.date_to,
            availability: r.availability,
          }));

          await channexPost(
            "/availability",
            { values: channexValues },
            channexApiKey,
            CHANNEX_BASE_URL,
          );

          // Mirror to Supabase
          const upsertRows = filtered.map((v) => ({
            property_id: propertyId,
            room_type_id: rt.id,
            date: v.date,
            available: v.available,
            updated_at: new Date().toISOString(),
          }));
          await supabase
            .from("availability")
            .upsert(upsertRows, { onConflict: "room_type_id,date" });

          roomTypeCount++;
        } catch (err: any) {
          errors.push(`[RT ${rt.id}] ${err.message}`);
        }
      }

      // ── 3. Push restrictions for all rate plans ─────────────────────────
      const { data: ratePlans, error: rpError } = await supabase
        .from("rate_plans")
        .select("id, channex_rate_plan_id, sell_mode")
        .eq("property_id", propertyId)
        .not("channex_rate_plan_id", "is", null);

      if (rpError) {
        errors.push(
          `[${propertyId}] Failed to load rate plans: ${rpError.message}`,
        );
        continue;
      }

      for (const rp of ratePlans ?? []) {
        try {
          // Load existing restrictions from Supabase for future dates
          const { data: existingRows, error: resError } = await supabase
            .from("restrictions")
            .select(
              "date, rate, min_stay_arrival, stop_sell, closed_to_arrival, closed_to_departure",
            )
            .eq("rate_plan_id", rp.id)
            .gte("date", today)
            .order("date");

          let entries: RestrictionEntry[];

          if (!resError && existingRows && existingRows.length > 0) {
            // Use stored values
            entries = existingRows.map((r) => ({
              date: r.date,
              rate: r.rate ?? 0,
              min_stay_arrival: r.min_stay_arrival ?? 1,
              stop_sell: r.stop_sell ?? false,
              closed_to_arrival: r.closed_to_arrival ?? false,
              closed_to_departure: r.closed_to_departure ?? false,
            }));
          } else {
            // No stored restrictions — push rate=0 for next 365 days as a safe default
            const dates = dateRange(today, PUSH_DAYS);
            entries = dates.map((d) => ({
              date: d,
              rate: 0,
              min_stay_arrival: 1,
              stop_sell: false,
              closed_to_arrival: false,
              closed_to_departure: false,
            }));
          }

          const filtered = filterPastDates(entries);
          const ranges = compressRestrictions(filtered);

          const channexValues = ranges.map((r) => {
            const v: Record<string, unknown> = {
              property_id: channexPropertyId,
              rate_plan_id: rp.channex_rate_plan_id,
              date_from: r.date_from,
              date_to: r.date_to,
            };
            if (rp.sell_mode === "per_person") {
              // For full-sync we use scalar rate since we don't store per-person breakdowns yet
              v.rates = [{ occupancy: 1, rate: r.rate ?? 0 }];
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
            { values: channexValues },
            channexApiKey,
            CHANNEX_BASE_URL,
          );
          ratePlanCount++;
        } catch (err: any) {
          errors.push(`[RP ${rp.id}] ${err.message}`);
        }
      }
    }

    console.log(
      `[fullSyncARI] source=${source} properties=${properties.length} roomTypes=${roomTypeCount} ratePlans=${ratePlanCount} errors=${errors.length}`,
    );

    return new Response(
      JSON.stringify({
        properties: properties.length,
        roomTypes: roomTypeCount,
        ratePlans: ratePlanCount,
        errors,
        source,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[fullSyncARI] Fatal error:", err.message);
    return new Response(JSON.stringify({ error: err.message, errors }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
