/**
 * pushAvailability — Edge Function
 *
 * Pushes per-date availability values to Channex POST /availability,
 * then upserts the rows into the local `availability` Supabase table.
 *
 * Body:
 * {
 *   propertyId:         string (local Supabase UUID)
 *   roomTypeId:         string (local Supabase UUID)
 *   channexPropertyId:  string (Channex UUID)
 *   channexRoomTypeId:  string (Channex UUID)
 *   values: [{ date: "YYYY-MM-DD", available: number }]
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
  compressAvailability,
  type AvailabilityEntry,
} from "../_shared/channex.ts";

const CHANNEX_BASE_URL = Deno.env.get("CHANNEX_BASE_URL");

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
    const {
      propertyId,
      roomTypeId,
      channexPropertyId,
      channexRoomTypeId,
      values,
    }: {
      propertyId: string;
      roomTypeId: string;
      channexPropertyId: string;
      channexRoomTypeId: string;
      values: AvailabilityEntry[];
    } = await req.json();

    if (
      !propertyId ||
      !roomTypeId ||
      !channexPropertyId ||
      !channexRoomTypeId
    ) {
      throw new Error(
        "Missing required IDs (propertyId, roomTypeId, channexPropertyId, channexRoomTypeId)",
      );
    }
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error(
        "values must be a non-empty array of { date, available }",
      );
    }

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // ── 1. Filter past dates (Channex rejects them) ──────────────────────
    const futureValues = filterPastDates(values);
    if (futureValues.length === 0) {
      return new Response(
        JSON.stringify({
          pushed: 0,
          ranges: 0,
          message: "All dates are in the past — nothing pushed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Sort ascending by date ─────────────────────────────────────────
    futureValues.sort((a, b) => a.date.localeCompare(b.date));

    // ── 3. Run-length encode into date ranges ─────────────────────────────
    const ranges = compressAvailability(futureValues);

    // ── 4. Build Channex payload ──────────────────────────────────────────
    const channexValues = ranges.map((r) => ({
      property_id: channexPropertyId,
      room_type_id: channexRoomTypeId,
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

    // ── 5. Upsert into Supabase availability table ────────────────────────
    // Use service role key so this works whether called from the client or
    // from another edge function (createRoomType / fullSyncARI).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const upsertRows = futureValues.map((v) => ({
      property_id: propertyId,
      room_type_id: roomTypeId,
      date: v.date,
      available: v.available,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("availability")
      .upsert(upsertRows, { onConflict: "room_type_id,date" });

    if (upsertError) {
      // Log but don't fail — Channex push succeeded; Supabase is a mirror.
      console.error(
        "[pushAvailability] Supabase upsert failed:",
        upsertError.message,
      );
    }

    return new Response(
      JSON.stringify({ pushed: futureValues.length, ranges: ranges.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[pushAvailability] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
