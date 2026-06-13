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
    const { localId, channexRoomTypeId, propertyId, restoringData } = await req.json();

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    // 1. Delete from Channex
    const channexRes = await fetch(`${CHANNEX_BASE_URL}/api/v1/room_types/${channexRoomTypeId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": channexApiKey,
      },
    });

    if (!channexRes.ok) {
      let errorBody;
      try { errorBody = await channexRes.json(); } catch { /* ignore */ }
      throw new Error(errorBody?.errors?.title || `Failed to delete room type in Channex (${channexRes.status})`);
    }

    // 2. Delete from Supabase
    const { error: supabaseError } = await supabase
      .from("room_types")
      .delete()
      .eq("id", localId);

    if (supabaseError) {
      // ROLLBACK: recreate in Channex and link back to the Supabase row
      console.warn("Supabase delete failed, recreating in Channex...");
      if (restoringData) {
        try {
          const payload = {
            room_type: {
              property_id: restoringData.channexPropertyId,
              title: restoringData.title,
              count_of_rooms: Number(restoringData.count_of_rooms) || 1,
              occ_adults: Number(restoringData.occ_adults) || 2,
              occ_children: Number(restoringData.occ_children) || 0,
              occ_infants: Number(restoringData.occ_infants) || 0,
              default_occupancy: Number(restoringData.default_occupancy) || 2,
              capacity: Number(restoringData.capacity) || null,
              room_kind: restoringData.room_kind || "room",
              content: {
                description: restoringData.content_description || undefined
              }
            }
          };

          const res = await fetch(`${CHANNEX_BASE_URL}/api/v1/room_types`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "user-api-key": channexApiKey,
            },
            body: JSON.stringify(payload),
          });
          
          const channexResult = await res.json();
          const newChannexId = channexResult?.data?.id;

          if (newChannexId) {
             await supabase.from("room_types").update({ channex_room_type_id: newChannexId }).eq("id", localId);
             return new Response(JSON.stringify({ 
               error: `Supabase delete failed: ${supabaseError.message}. Successfully rolled back.`, 
               newChannexId 
             }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
          }
        } catch (rollbackError) {
          console.error("Failed to rollback Channex room type deletion:", rollbackError);
        }
      }
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
