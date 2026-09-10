/**
 * getChannexInventory/index.ts
 *
 * Step 5 of the OTA channel wizard.
 * Fetches Channex-side room types and rate plans for a property using the
 * dedicated /options endpoints (NOT the mapping_details OTA-side call).
 *
 *   GET /api/v1/room_types/options?filter[property_id]={channex_property_id}
 *   GET /api/v1/rate_plans/options?filter[property_id]={channex_property_id}&multi_occupancy=true
 *
 * The multi_occupancy=true flag on rate plans expands per-occupancy rows —
 * required for Booking.com and any OTA that uses occupancy-based pricing.
 *
 * Request body:
 *   { channex_property_id: "uuid" }
 *
 * Response (success):
 *   {
 *     roomTypes: [
 *       { id: "uuid", title: "Deluxe Room", count_of_rooms: 5 }
 *     ],
 *     ratePlans: [
 *       {
 *         id: "uuid",
 *         title: "Standard Rate",
 *         room_type_id: "uuid",   // parent room type UUID
 *         occupancy: 2,           // only present when multi_occupancy=true expands rows
 *         sell_mode: "per_room" | "per_person",
 *         rate_mode: "manual" | "derived"
 *       }
 *     ]
 *   }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { channexGet } from "../_shared/channex.ts";

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
    const { channex_property_id } = await req.json();

    if (!channex_property_id) {
      throw new Error("channex_property_id is required");
    }

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // -- Fetch both in parallel -----------------------------------------------
    const [rawRoomTypes, rawRatePlans] = await Promise.all([
      channexGet(
        `/room_types/options?filter[property_id]=${channex_property_id}`,
        channexApiKey,
        CHANNEX_BASE_URL,
      ) as Promise<any[]>,
      channexGet(
        `/rate_plans/options?filter[property_id]=${channex_property_id}&multi_occupancy=true`,
        channexApiKey,
        CHANNEX_BASE_URL,
      ) as Promise<any[]>,
    ]);

    // -- Normalise room types -------------------------------------------------
    // /room_types/options returns: [{ id, title, count_of_rooms, property_id, ... }]
    // channexGet already unwraps the outer { data: [...] } envelope.
    const roomTypes = (Array.isArray(rawRoomTypes) ? rawRoomTypes : []).map(
      (rt: any) => ({
        id:             rt.id,
        title:          rt.title ?? rt.attributes?.title ?? rt.id,
        count_of_rooms: rt.count_of_rooms ?? rt.attributes?.count_of_rooms ?? null,
      }),
    );

    // -- Normalise rate plans -------------------------------------------------
    // /rate_plans/options?multi_occupancy=true returns expanded rows:
    // [{ id, title, room_type_id, occupancy, sell_mode, rate_mode, ... }]
    const ratePlans = (Array.isArray(rawRatePlans) ? rawRatePlans : []).map(
      (rp: any) => ({
        id:           rp.id,
        title:        rp.title ?? rp.attributes?.title ?? rp.id,
        room_type_id: rp.room_type_id ?? rp.attributes?.room_type_id ?? null,
        occupancy:    rp.occupancy ?? rp.attributes?.occupancy ?? null,
        sell_mode:    rp.sell_mode ?? rp.attributes?.sell_mode ?? "per_room",
        rate_mode:    rp.rate_mode ?? rp.attributes?.rate_mode ?? "manual",
      }),
    );

    return new Response(
      JSON.stringify({ roomTypes, ratePlans }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[getChannexInventory]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
