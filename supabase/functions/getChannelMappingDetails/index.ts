/**
 * getChannelMappingDetails/index.ts
 *
 * Step 2 of the OTA channel wizard.
 * Fetches:
 *   - OTA room/rate codes from POST /channels/mapping_details
 *   - Channex group_id from GET /groups (required when creating a channel)
 *
 * Request body:
 *   { platform: "booking", hotel_id: "12345" }
 *
 * Response (success):
 *   {
 *     rooms: [
 *       {
 *         room_code: 12345,           // integer — Booking.com room type code
 *         room_name: "Double Room",
 *         rates: [
 *           {
 *             rate_code: 67890,       // integer — Booking.com rate plan code
 *             rate_name: "Standard",
 *             pricing: "OBP" | "PP",
 *             max_persons: 2,
 *             occupancies: [1, 2]
 *           }
 *         ]
 *       }
 *     ],
 *     group_id: "uuid"               // Channex group UUID to pass to POST /channels
 *   }
 *
 * IMPORTANT: room_code / rate_code are INTEGERS from Channex. They must be
 * stored and sent as integers, not strings, or Channex will silently place
 * the mapping under "Removed Rates" on the OTA side.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { channexPost, channexGet } from "../_shared/channex.ts";

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
    const { channel, platform, hotel_id } = await req.json();
    const targetChannel = channel || platform;

    if (!targetChannel || !hotel_id) {
      throw new Error("channel and hotel_id are required");
    }

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    // ── 1. Fetch OTA room/rate mapping details ──────────────────────────────
    // POST /channels/mapping_details returns the OTA's room+rate structure.
    // For Booking.com the shape is: { rooms: [{ code, title, rates: [{ code, title, pricing, max_persons, occupancies }] }] }
    // Codes are integers — Channex confirmed trap.
    const mappingRaw = await channexPost(
      "/channels/mapping_details",
      { channel: targetChannel, settings: { hotel_id } },
      channexApiKey,
      CHANNEX_BASE_URL,
    ) as any;

    // Normalise the Booking.com shape into a stable { rooms: [...] } form.
    // The raw response wraps everything under data.attributes or data directly —
    // channexPost already unwraps the outer { data } envelope.
    const rawRooms: any[] = mappingRaw?.rooms ?? mappingRaw?.attributes?.rooms ?? [];
    const pricing_type: string = mappingRaw?.pricing_type ?? "Standard";

    const rooms = rawRooms.map((room: any) => {
      const roomCode = Number(room.id ?? room.code ?? room.room_code);
      return {
        room_code: roomCode,      // always integer
        room_name: room.title ?? room.name ?? String(roomCode),
        rates: (room.rates ?? []).map((rate: any) => {
          const rateCode = Number(rate.id ?? rate.code ?? rate.rate_code);
          return {
            rate_code: rateCode,    // always integer
            rate_name: rate.title ?? rate.name ?? String(rateCode),
            pricing: rate.pricing ?? pricing_type,
            readonly: Boolean(rate.readonly),
            max_persons: rate.max_persons ?? 1,
            occupancies: rate.occupancies ?? [],
          };
        }),
      };
    });

    // ── 2. Resolve group_id ────────────────────────────────────────────────
    // GET /groups returns the Channex groups the API key can access.
    // We take the first group; for most accounts there's only one.
    // group_id is required on POST /channels — without it Channex returns
    // 422 "You not have access to requested group".
    const groups = (await channexGet("/groups", channexApiKey, CHANNEX_BASE_URL)) as any[];
    const group_id: string | null = groups?.[0]?.id ?? null;

    if (!group_id) {
      throw new Error(
        "Could not resolve a Channex group_id. Ensure the API key has access to at least one group.",
      );
    }

    // ── 3. Fetch connection details (Step 4: Currency) ─────────────────────
    let currency: string | null = null;
    try {
      const connDetailsRaw = (await channexPost(
        "/channels/connection_details",
        { channel: targetChannel, settings: { hotel_id } },
        channexApiKey,
        CHANNEX_BASE_URL,
      )) as any;
      currency =
        connDetailsRaw?.attributes?.currency ??
        connDetailsRaw?.currency ??
        null;
    } catch (connErr: any) {
      console.warn(
        "[getChannelMappingDetails] Could not fetch connection_details:",
        connErr.message,
      );
    }

    return new Response(
      JSON.stringify({ rooms, pricing_type, currency, group_id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("[getChannelMappingDetails]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
