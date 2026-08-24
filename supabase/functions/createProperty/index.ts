import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const channexBaseUrl = Deno.env.get("CHANNEX_BASE_URL");
  const channexApiKey = Deno.env.get("CHANNEX_API_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey || !channexApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, password, fullName, resolvedForm } = await req.json();

    if (!email || !password || !resolvedForm) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- 1. Create Auth User ---
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || "Property Owner",
        },
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Auth Error: ${authError.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const newUserId = authData.user.id;

    // Insert public user record
    const { error: upsertError } = await supabaseAdmin.from("users").upsert({
      id: newUserId,
      email: email,
      full_name: fullName || "Property Owner",
      role: "owner",
    });
    if (upsertError)
      console.error("[DEBUG] Failed to upsert public user:", upsertError);

    // --- 2. Create Property in Channex ---
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
          allow_availability_autoupdate_on_confirmation:
            resolvedForm.settings.allow_availability_autoupdate_on_confirmation,
          allow_availability_autoupdate_on_modification:
            resolvedForm.settings.allow_availability_autoupdate_on_modification,
          allow_availability_autoupdate_on_cancellation:
            resolvedForm.settings.allow_availability_autoupdate_on_cancellation,
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
          important_information:
            resolvedForm.content.important_information || undefined,
          photos:
            resolvedForm.content.photos.length > 0
              ? resolvedForm.content.photos
              : undefined,
        },
      },
    };

    const channexRes = await fetch(`${channexBaseUrl}/api/v1/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": channexApiKey,
      },
      body: JSON.stringify(channexPayload),
    });

    if (!channexRes.ok) {
      // Rollback User
      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      let errorBody;
      try {
        errorBody = await channexRes.json();
      } catch {}
      const errorMsg =
        errorBody?.errors?.title || `Channex API error (${channexRes.status})`;
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const channexResult = await channexRes.json();
    const propertyData = channexResult.data;
    const attrs = propertyData.attributes;

    // --- 3. Save to Supabase DB ---
    try {
      const { data: property, error: propertyError } = await supabaseAdmin
        .from("properties")
        .insert([
          {
            user_id: newUserId,
            channex_property_id: propertyData.id,
            name: attrs.title,
            status: attrs.is_active ? "active" : "inactive",
            owner_email: attrs.email,
            owner_phone: attrs.phone,
            owner_name: resolvedForm.owner_name || attrs.owner_name || "",
            currency: attrs.currency,
            property_type: attrs.property_type,
            commission_rate:
              resolvedForm.commission_rate || attrs.commission_rate || 15,
            channex_settings: attrs.settings || {},
            content_description: attrs.content?.description || null,
            content_imp_info: attrs.content?.important_information || null,
          },
        ])
        .select("id")
        .single();

      if (propertyError) throw propertyError;

      const localPropertyId = property.id;

      // Address
      const { error: addressError } = await supabaseAdmin
        .from("property_address")
        .insert([
          {
            property_id: localPropertyId,
            address_line: attrs.address || null,
            city: attrs.city || null,
            state: attrs.state || null,
            country: attrs.country || null,
            postcode: attrs.zip_code || null,
            latitude: attrs.latitude || null,
            longitude: attrs.longitude || null,
          },
        ]);
      if (addressError) console.error("[DEBUG] Address Error:", addressError);

      // Photos
      const photos = attrs.content?.photos || [];
      if (photos.length > 0) {
        const photosToInsert = photos.map((photo: any) => ({
          property_id: localPropertyId,
          channex_photo_id: photo.id,
          url: photo.url,
          position: photo.position || 0,
          description: photo.description || null,
        }));
        const { error: photosError } = await supabaseAdmin
          .from("property_photos")
          .insert(photosToInsert);
        if (photosError) console.error("[DEBUG] Photos Error:", photosError);
      }

      // Groups
      const groups = propertyData.relationships?.groups?.data || [];
      for (const group of groups) {
        const { data: savedGroup, error: groupError } = await supabaseAdmin
          .from("property_groups")
          .upsert(
            {
              channex_group_id: group.id,
              title: group.attributes?.title || "Unknown Group",
            },
            { onConflict: "channex_group_id" },
          )
          .select("id")
          .single();

        if (!groupError && savedGroup) {
          await supabaseAdmin
            .from("property_group_assignments")
            .insert({ property_id: localPropertyId, group_id: savedGroup.id });
        }
      }

      // --- 4. Send Email ---
      const smtpHost = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
      const smtpPort = parseInt(Deno.env.get("SMTP_PORT") ?? "465");
      const smtpUser = Deno.env.get("SMTP_USERNAME") ?? "";
      const smtpPass = Deno.env.get("SMTP_PASSWORD") ?? "";
      if (smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });
          await transporter.sendMail({
            from: smtpUser,
            to: email,
            subject: "Your New Property Account",
            text: `Hello ${fullName || "Property Owner"},\n\nAn account has been created for your new property!\n\nYour temporary password is: ${password}\n\nPlease log in and change this as soon as possible.`,
          });
        } catch (smtpError) {
          console.error("[DEBUG] SMTP Error:", smtpError);
        }
      }

      return new Response(JSON.stringify({ property, user: authData.user }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (dbError: any) {
      // Rollback Database Failure
      console.error("[DEBUG] DB Error:", dbError);

      // Delete Channex property
      await fetch(`${channexBaseUrl}/api/v1/properties/${propertyData.id}`, {
        method: "DELETE",
        headers: { "user-api-key": channexApiKey },
      });

      // Delete user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      return new Response(
        JSON.stringify({ error: `Database Error: ${dbError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
