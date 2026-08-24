/**
 * pushRestrictions — Edge Function
 *
 * Pushes per-date rate plan restrictions to Channex POST /restrictions,
 * then upserts the rows into the local `restrictions` Supabase table.
 *
 * Handles both per_room (scalar `rate`) and per_person (`rates` array) sell modes.
 * Channex applies partial updates — only send the fields that are changing.
 *
 * Body:
 * {
 *   propertyId:        string (local Supabase UUID)
 *   ratePlanId:        string (local Supabase UUID)
 *   channexPropertyId: string (Channex UUID)
 *   channexRatePlanId: string (Channex UUID)
 *   sellMode:          "per_room" | "per_person"
 *   values: [{
 *     date:                "YYYY-MM-DD",
 *     rate:                number,   // MINOR units (cents) — convert in UI before calling
 *     min_stay_arrival?:   number,
 *     stop_sell?:          boolean,
 *     closed_to_arrival?:  boolean,
 *     closed_to_departure?: boolean,
 *
 *     // per_person only — rates array indexed by occupancy
 *     occupancy_rates?: [{ occupancy: number, rate: number }]
 *   }]
 * }
 *
 * Returns:
 * { pushed: number, ranges: number }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  channexPost,
  filterPastDates,
  compressRestrictions,
  type RestrictionEntry,
} from "../_shared/channex.ts";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RestrictionValueInput extends RestrictionEntry {
  occupancy_rates?: Array<{ occupancy: number; rate: number }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      propertyId,
      ratePlanId,
      channexPropertyId,
      channexRatePlanId,
      sellMode = "per_room",
      values,
    }: {
      propertyId: string;
      ratePlanId: string;
      channexPropertyId: string;
      channexRatePlanId: string;
      sellMode?: "per_room" | "per_person";
      values: RestrictionValueInput[];
    } = await req.json();

    if (
      !propertyId ||
      !ratePlanId ||
      !channexPropertyId ||
      !channexRatePlanId
    ) {
      throw new Error("Missing required IDs");
    }
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("values must be a non-empty array");
    }

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // ── 1. Filter past dates ──────────────────────────────────────────────
    const futureValues = filterPastDates(values) as RestrictionValueInput[];
    if (futureValues.length === 0) {
      return new Response(
        JSON.stringify({
          pushed: 0,
          ranges: 0,
          message: "All dates are in the past",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Sort ascending ─────────────────────────────────────────────────
    futureValues.sort((a, b) => a.date.localeCompare(b.date));

    // ── 3. Run-length encode ──────────────────────────────────────────────
    const ranges = compressRestrictions(futureValues);

    // ── 4. Build Channex payload ──────────────────────────────────────────
    // The API shape differs between per_room and per_person.
    const channexValues = ranges.map((r) => {
      const base: Record<string, unknown> = {
        property_id: channexPropertyId,
        rate_plan_id: channexRatePlanId,
        date_from: r.date_from,
        date_to: r.date_to,
      };

      if (r.min_stay_arrival !== undefined)
        base.min_stay_arrival = r.min_stay_arrival;
      if (r.stop_sell !== undefined) base.stop_sell = r.stop_sell;
      if (r.closed_to_arrival !== undefined)
        base.closed_to_arrival = r.closed_to_arrival;
      if (r.closed_to_departure !== undefined)
        base.closed_to_departure = r.closed_to_departure;

      if (sellMode === "per_person") {
        // For per_person plans Channex expects a `rates` array keyed by occupancy.
        // We look up the occupancy_rates from the first entry in the range (all equal after compression).
        const refEntry = futureValues.find(
          (v) => v.date >= r.date_from && v.date <= r.date_to,
        );
        base.rates = refEntry?.occupancy_rates ?? [
          { occupancy: 1, rate: r.rate ?? 0 },
        ];
      } else {
        base.rate = r.rate ?? 0;
      }

      return base;
    });

    await channexPost(
      "/restrictions",
      { values: channexValues },
      channexApiKey,
      CHANNEX_BASE_URL,
    );

    // ── 5. Upsert into Supabase restrictions table ────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const upsertRows = futureValues.map((v) => ({
      property_id: propertyId,
      rate_plan_id: ratePlanId,
      date: v.date,
      rate: v.rate ?? 0,
      min_stay_arrival: v.min_stay_arrival ?? 1,
      stop_sell: v.stop_sell ?? false,
      closed_to_arrival: v.closed_to_arrival ?? false,
      closed_to_departure: v.closed_to_departure ?? false,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("restrictions")
      .upsert(upsertRows, { onConflict: "rate_plan_id,date" });

    if (upsertError) {
      console.error(
        "[pushRestrictions] Supabase upsert failed:",
        upsertError.message,
      );
    }

    return new Response(
      JSON.stringify({ pushed: futureValues.length, ranges: ranges.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[pushRestrictions] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
