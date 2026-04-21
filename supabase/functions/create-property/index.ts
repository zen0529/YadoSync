import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BEDS24_BASE_URL = "https://api.beds24.com/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const getAccessToken = async (refreshToken: string) => {
  const res = await fetch(`${BEDS24_BASE_URL}/authentication/token`, {
    method: "GET",
    headers: {
      refreshToken: refreshToken,
    },
  });
  if (!res.ok) throw new Error(`Beds24 auth failed: ${res.status}`);
  const data = await res.json();
  console.log("Beds24 auth response:", data);
  if (!data.token) throw new Error("Beds24 did not return an access token");
  return data.token;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const form = await req.json();
    const beds24Name = form.name; // handleSave sends { ...form, name: beds24Name }

    const refreshToken = Deno.env.get("BEDS24_REFRESH_TOKEN");
    if (!refreshToken) throw new Error("BEDS24_REFRESH_TOKEN secret not set");

    // Step 1 — Get access token
    const accessToken = await getAccessToken(refreshToken);
    console.log("Access token obtained:", accessToken ? "yes" : "no");

    // Step 2 — Use token header (Beds24 v2 uses 'token' not 'Authorization: Bearer')
    const headers = {
      "Content-Type": "application/json",
      token: accessToken,
    };
    

    // Step 3 — Create property in Beds24
    const createRes = await fetch(`${BEDS24_BASE_URL}/properties`, {
      method: "POST",
      headers,
      body: JSON.stringify([
        {
          name: form.name,
          propertyType: form.propertyType,
          currency: form.currency,
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          postcode: form.postcode,
          mobile: form.ownerPhone,
        },
      ]),
    });

    const createData = await createRes.json();
    console.log("Beds24 create property result:", createData);

    if (!createRes.ok)
      throw new Error(`Beds24 createProperty failed: ${createRes.status}`);

    const createResult = createData[0];
    if (!createResult?.success) {
      throw new Error(
        createResult?.errors?.[0]?.message || "Beds24 property creation failed",
      );
    }

    // Step 4 — Fetch all properties to get the new ID
    const listRes = await fetch(`${BEDS24_BASE_URL}/properties`, { headers });

    console.log("Beds24 list properties response status:", listRes);
    
    if (!listRes.ok)
      throw new Error(`Beds24 listProperties failed: ${listRes.status}`);
    const listData = await listRes.json();

    console.log("Beds24 properties response:", JSON.stringify(listData));

    const properties = listData.data ?? listData;

    const match = properties.find((p: any) => p.name === beds24Name);
    if (!match)
      throw new Error(
        "Property created in Beds24 but could not retrieve its ID.",
      );

    return new Response(
      JSON.stringify({ beds24PropertyId: String(match.id) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
