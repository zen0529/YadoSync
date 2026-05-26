import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || "Property Owner",
      }
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = authData.user.id;

    // Upsert the user into the public.users table so they are guaranteed to exist there.
    const { error: upsertError } = await supabaseAdmin.from("users").upsert({
      id: newUserId,
      email: email,
      full_name: fullName || "Property Owner",
      role: "owner"
    });

    if (upsertError) {
      console.error("[DEBUG] Failed to upsert public user:", upsertError);
    }

    // --- Send Email via Deno SMTP ---
    const smtpHost = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") ?? "465");
    const smtpUser = Deno.env.get("SMTP_USERNAME") ?? "";
    const smtpPass = Deno.env.get("SMTP_PASSWORD") ?? "";

    console.log("[DEBUG] SMTP_USER:", smtpUser);
    console.log("[DEBUG] SMTP_PASS_LENGTH:", smtpPass.length);

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpUser,
          to: email,
          subject: "Your New Property Account",
          text: `Hello ${fullName || 'Property Owner'},\n\nAn account has been created for your new property!\n\nYour temporary password is: ${password}\n\nPlease log in and change this as soon as possible.`,
        });
      } catch (smtpError) {
        console.error("[DEBUG] SMTP Error:", smtpError);
      }
    } else {
      console.log("[DEBUG] Skipping SMTP email because SMTP_USERNAME or SMTP_PASSWORD is not set.");
    }

    return new Response(JSON.stringify({ user: authData.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
