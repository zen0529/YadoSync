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
    const { propertyId, channexPropertyId, form } = await req.json();

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    // 1. Create in Channex
    const channexPayload = {
      room_type: {
        property_id: channexPropertyId,
        title: form.title,
        count_of_rooms: Number(form.count_of_rooms) || 1,
        occ_adults: Number(form.occ_adults) || 2,
        occ_children: Number(form.occ_children) || 0,
        occ_infants: Number(form.occ_infants) || 0,
        default_occupancy: Number(form.default_occupancy) || 2,
        capacity: Number(form.capacity) || null,
        room_kind: form.room_kind || "room",
        content: {
          description: form.description || undefined,
          photos: form.content?.photos?.length > 0 ? form.content.photos : undefined,
        },
      },
    };

    const channexRes = await fetch(`${CHANNEX_BASE_URL}/api/v1/room_types`, {
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
      throw new Error(errorBody?.errors?.title || `Failed to create room type in Channex (${channexRes.status})`);
    }

    const channexData = await channexRes.json();
    const channexId = channexData?.data?.id;
    if (!channexId) throw new Error("Channex did not return a room type ID.");

    try {
      // 2. Insert into Supabase
      const { data: row, error: supabaseError } = await supabase
        .from("room_types")
        .insert([{
          property_id: propertyId,
          channex_room_type_id: channexId,
          title: form.title,
          count_of_rooms: Number(form.count_of_rooms) || 1,
          occ_adults: Number(form.occ_adults) || 2,
          occ_children: Number(form.occ_children) || 0,
          occ_infants: Number(form.occ_infants) || 0,
          default_occupancy: Number(form.default_occupancy) || 2,
          capacity: Number(form.capacity) || null,
          room_kind: form.room_kind || "room",
          content_description: form.description || null,
        }])
        .select("*")
        .single();

      if (supabaseError) throw new Error(`Supabase insert failed: ${supabaseError.message}`);

      // Insert photos into property_photos if they exist
      if (form.content?.photos?.length > 0) {
        const photosToInsert = form.content.photos.map((photo: any) => ({
          property_id: propertyId,
          room_type_id: row.id,
          channex_photo_id: photo.id || null,
          url: photo.url,
          position: photo.position || 0,
          description: photo.description || null
        }));

        const { error: photosError } = await supabase
          .from("property_photos")
          .insert(photosToInsert);
          
        if (photosError) {
          console.error("[DEBUG] Failed to insert room type photos:", photosError.message);
        }
      }

      return new Response(JSON.stringify({ row }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      // 3. Rollback: If Supabase fails, delete the record from Channex
      console.warn(`Rolling back Channex room type ${channexId} due to Supabase error...`);
      try {
        await fetch(`${CHANNEX_BASE_URL}/api/v1/room_types/${channexId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "user-api-key": channexApiKey,
          },
        });
      } catch (rollbackError) {
        console.error("Failed to rollback Channex room type:", rollbackError);
      }

      throw error; 
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
