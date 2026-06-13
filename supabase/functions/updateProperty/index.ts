import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const channexBaseUrl = Deno.env.get("CHANNEX_BASE_URL") ?? "https://staging.channex.io";
  const channexApiKey = Deno.env.get("CHANNEX_API_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey || !channexApiKey) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { propertyId, channexPropertyId, resolvedForm, deletedPhotos } = await req.json();

    if (!propertyId || !channexPropertyId || !resolvedForm) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- 1. Update Property in Channex ---
    const channexPayload = {
      property: {
        title: resolvedForm.title,
        is_active: resolvedForm.status === "active",
        currency: resolvedForm.currency,
        email: resolvedForm.email || undefined,
        phone: resolvedForm.phone || undefined,
        zip_code: resolvedForm.zip_code || undefined,
        country: resolvedForm.country || undefined,
        state: resolvedForm.state || undefined,
        city: resolvedForm.city || undefined,
        address: resolvedForm.address || undefined,
        longitude: resolvedForm.longitude || undefined,
        latitude: resolvedForm.latitude || undefined,
        timezone: resolvedForm.timezone || undefined,
        property_type: resolvedForm.property_type || undefined,
        logo_url: resolvedForm.logo_url || undefined,
        website: resolvedForm.website || undefined,
        facilities: [],
        settings: {
          allow_availability_autoupdate_on_confirmation: resolvedForm.settings.allow_availability_autoupdate_on_confirmation,
          allow_availability_autoupdate_on_modification: resolvedForm.settings.allow_availability_autoupdate_on_modification,
          allow_availability_autoupdate_on_cancellation: resolvedForm.settings.allow_availability_autoupdate_on_cancellation,
          min_stay_type: resolvedForm.settings.min_stay_type,
          min_price: resolvedForm.settings.min_price || null,
          max_price: resolvedForm.settings.max_price || null,
          state_length: resolvedForm.settings.state_length,
          cut_off_time: resolvedForm.settings.cut_off_time,
          cut_off_days: resolvedForm.settings.cut_off_days,
          max_day_advance: resolvedForm.settings.max_day_advance || null,
        },
        content: {
          description: resolvedForm.content.description || undefined,
          important_information: resolvedForm.content.important_information || undefined,
          photos: resolvedForm.content.photos.length > 0 ? resolvedForm.content.photos : undefined,
        },
      },
    };

    const channexRes = await fetch(`${channexBaseUrl}/api/v1/properties/${channexPropertyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": channexApiKey,
      },
      body: JSON.stringify(channexPayload),
    });

    if (!channexRes.ok) {
      let errorBody;
      try { errorBody = await channexRes.json(); } catch { }
      const errorMsg = errorBody?.errors?.title || `Channex API error (${channexRes.status})`;
      return new Response(JSON.stringify({ error: errorMsg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const channexResult = await channexRes.json();
    
    // --- 2. Photo Mapping Logic ---
    const deletedChannexIds = new Set(
      (deletedPhotos || []).filter((p: any) => p.channexId).map((p: any) => p.channexId)
    );
    const channexResponsePhotos = (channexResult.data?.attributes?.content?.photos || [])
      .filter((p: any) => !deletedChannexIds.has(p.id));

    const channexById: any = {};
    const channexByPosition: any = {};
    channexResponsePhotos.forEach((p: any) => {
      if (p.id) channexById[p.id] = p;
      if (p.position !== undefined) channexByPosition[p.position] = p;
    });

    const uploadedPhotos = resolvedForm.content.photos || [];
    const photosDataWithIds = uploadedPhotos
      .map((p: any) => {
        const channexEntry = p.id ? channexById[p.id] : channexByPosition[p.position];
        if (!channexEntry) return null;
        return {
          id: channexEntry.id,
          url: p.url,
          position: p.position,
          description: p.description || "",
          kind: p.kind || "photo",
        };
      })
      .filter(Boolean);

    // --- 3. Save to Supabase DB ---
    try {
      const attrs = channexResult.data.attributes;
      
      const propertyData = {
        name: resolvedForm.title,
        status: resolvedForm.status === "active" ? "active" : "inactive",
        owner_email: resolvedForm.email,
        owner_phone: resolvedForm.phone,
        owner_name: resolvedForm.owner_name,
        currency: resolvedForm.currency,
        property_type: resolvedForm.property_type,
        commission_rate: resolvedForm.commission_rate,
        channex_settings: attrs.settings || {},
        content_description: resolvedForm.content.description || null,
        content_imp_info: resolvedForm.content.important_information || null,
      };

      const { data: property, error: propertyError } = await supabaseAdmin
        .from("properties")
        .update(propertyData)
        .eq("id", propertyId)
        .select()
        .single();

      if (propertyError) throw propertyError;

      const addressData = {
        address_line: resolvedForm.address || null,
        city: resolvedForm.city || null,
        state: resolvedForm.state || null,
        country: resolvedForm.country || null,
        postcode: resolvedForm.zip_code || null,
        latitude: resolvedForm.latitude || null,
        longitude: resolvedForm.longitude || null
      };

      const { error: addressError } = await supabaseAdmin
        .from("property_address")
        .update(addressData)
        .eq("property_id", propertyId);
        
      if (addressError) console.error("[DEBUG] Address Error:", addressError);

      if (photosDataWithIds !== null) {
        const { error: deleteError } = await supabaseAdmin
          .from("property_photos")
          .delete()
          .eq("property_id", propertyId);
          
        if (deleteError) {
          console.error("[DEBUG] Failed to delete old photos:", deleteError);
        } else if (photosDataWithIds.length > 0) {
          const photosToInsert = photosDataWithIds.map((photo: any) => ({
            property_id: propertyId,
            channex_photo_id: photo.id,
            url: photo.url,
            position: photo.position || 0,
            description: photo.description || null
          }));
          const { error: insertError } = await supabaseAdmin
            .from("property_photos")
            .insert(photosToInsert);
          if (insertError) console.error("[DEBUG] Failed to insert new photos:", insertError);
        }
      }

      return new Response(JSON.stringify({ property }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (dbError: any) {
      console.error("[DEBUG] DB Error:", dbError);
      return new Response(JSON.stringify({ error: `Database Error: ${dbError.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
