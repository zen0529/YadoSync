import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { localId, channexRatePlanId } = await req.json();

    const channexApiKey = Deno.env.get("CHANNEX_API_KEY");
    if (!channexApiKey) throw new Error("CHANNEX_API_KEY secret not set");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } },
    );

    // 0. Snapshot the current row so we can roll back Channex if Supabase delete fails
    const { data: originalRow, error: fetchError } = await supabase
      .from("rate_plans")
      .select("*")
      .eq("id", localId)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch current rate plan for rollback snapshot: ${fetchError.message}`,
      );
    }

    // Build the rollback payload from the snapshot (to re-create in Channex if needed)
    const originalOptions = Array.isArray(originalRow.options)
      ? originalRow.options
      : [];
    const rollbackPayload = {
      rate_plan: {
        property_id: originalRow.channex_property_id ?? undefined,
        room_type_id: originalRow.channex_room_type_id ?? undefined,
        title: originalRow.title,
        tax_set_id: originalRow.tax_set_id ?? null,
        parent_rate_plan_id: originalRow.parent_rate_plan_id ?? null,
        children_fee: originalRow.children_fee ?? "0.00",
        infant_fee: originalRow.infant_fee ?? "0.00",
        max_stay: originalRow.max_stay ?? 0,
        min_stay_arrival: originalRow.min_stay_arrival ?? 1,
        min_stay_through: originalRow.min_stay_through ?? 1,
        closed_to_arrival: originalRow.closed_to_arrival ?? false,
        closed_to_departure: originalRow.closed_to_departure ?? false,
        stop_sell: originalRow.stop_sell ?? false,
        options: originalOptions,
        currency: originalRow.currency ?? null,
        sell_mode: originalRow.sell_mode ?? "per_room",
        rate_mode: originalRow.rate_mode ?? "manual",
        inherit_rate: originalRow.inherit_settings?.rate ?? false,
        inherit_closed_to_arrival:
          originalRow.inherit_settings?.closed_to_arrival ?? false,
        inherit_closed_to_departure:
          originalRow.inherit_settings?.closed_to_departure ?? false,
        inherit_stop_sell: originalRow.inherit_settings?.stop_sell ?? false,
        inherit_min_stay_arrival:
          originalRow.inherit_settings?.min_stay_arrival ?? false,
        inherit_min_stay_through:
          originalRow.inherit_settings?.min_stay_through ?? false,
        inherit_max_stay: originalRow.inherit_settings?.max_stay ?? false,
        inherit_max_sell: originalRow.inherit_settings?.max_sell ?? false,
        inherit_max_availability:
          originalRow.inherit_settings?.max_availability ?? false,
        inherit_availability_offset:
          originalRow.inherit_settings?.availability_offset ?? false,
        auto_rate_settings: originalRow.auto_rate_settings ?? null,
      },
    };

    // 1. Delete from Channex
    const channexRes = await fetch(
      `${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "user-api-key": channexApiKey,
        },
      },
    );

    if (!channexRes.ok) {
      let errorBody;
      try {
        errorBody = await channexRes.json();
      } catch {
        /* ignore */
      }
      throw new Error(
        errorBody?.errors?.title ||
          `Failed to delete rate plan in Channex (${channexRes.status})`,
      );
    }

    // 2. Delete from Supabase — if this fails, recover via status-based approach
    try {
      const { error: supabaseError } = await supabase
        .from("rate_plans")
        .delete()
        .eq("id", localId);

      if (supabaseError) {
        throw new Error(`Supabase delete failed: ${supabaseError.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (deleteError: any) {
      // --- Recovery path ---
      // Channex deletion succeeded but Supabase delete failed.
      // Steps:
      //   A. Re-create the rate plan in Channex (rollback) → UUID-B
      //   B. Mark the zombie row as 'inactive' (hides it from the UI)
      //   C. Insert a new 'active' rate_plans row pointing to UUID-B,
      //      preserving the original created_at
      //   D. Return success — user sees a clean state
      console.warn(
        `[deleteRatePlan] Supabase delete failed for rate plan ${localId} — starting recovery...`,
      );
      console.error(`[deleteRatePlan] Delete error: ${deleteError.message}`);

      // Service role client — bypasses RLS for system-level recovery operations
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // A. Re-create the rate plan in Channex → UUID-B
      let newChannexRatePlanId: string | null = null;
      try {
        const rollbackRes = await fetch(
          `${CHANNEX_BASE_URL}/api/v1/rate_plans`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "user-api-key": channexApiKey,
            },
            body: JSON.stringify(rollbackPayload),
          },
        );

        if (rollbackRes.ok) {
          const rollbackData = await rollbackRes.json();
          newChannexRatePlanId = rollbackData?.data?.id ?? null;
          console.log(
            `[deleteRatePlan] Channex rollback succeeded — new rate plan UUID: ${newChannexRatePlanId}`,
          );
        } else {
          console.error(
            `[deleteRatePlan] Channex rollback POST failed (${rollbackRes.status})`,
          );
        }
      } catch (rollbackError: any) {
        console.error(
          `[deleteRatePlan] Channex rollback threw: ${rollbackError.message}`,
        );
      }

      // B. Mark the zombie row as 'inactive' so it is hidden from the UI
      const { error: inactiveError } = await serviceClient
        .from("rate_plans")
        .update({ status: "inactive" })
        .eq("id", localId);

      if (inactiveError) {
        console.error(
          `[deleteRatePlan] Failed to mark zombie row as inactive: ${inactiveError.message}`,
        );
      } else {
        console.log(
          `[deleteRatePlan] Zombie row ${localId} marked as inactive`,
        );
      }

      // C. Insert a new 'active' row pointing to UUID-B, preserving original created_at
      if (newChannexRatePlanId) {
        const { error: insertError } = await serviceClient
          .from("rate_plans")
          .insert({
            property_id: originalRow.property_id,
            room_type_id: originalRow.room_type_id,
            channex_rate_plan_id: newChannexRatePlanId,
            title: originalRow.title,
            currency: originalRow.currency,
            sell_mode: originalRow.sell_mode,
            rate_mode: originalRow.rate_mode,
            tax_set_id: originalRow.tax_set_id,
            parent_rate_plan_id: originalRow.parent_rate_plan_id,
            children_fee: originalRow.children_fee,
            infant_fee: originalRow.infant_fee,
            min_stay_arrival: originalRow.min_stay_arrival,
            min_stay_through: originalRow.min_stay_through,
            max_stay: originalRow.max_stay,
            closed_to_arrival: originalRow.closed_to_arrival,
            closed_to_departure: originalRow.closed_to_departure,
            stop_sell: originalRow.stop_sell,
            inherit_settings: originalRow.inherit_settings,
            options: originalRow.options,
            auto_rate_settings: originalRow.auto_rate_settings,
            created_at: originalRow.created_at,
            status: "active",
          });

        if (insertError) {
          console.error(
            `[deleteRatePlan] Failed to insert replacement rate_plans row: ${insertError.message}`,
          );
        } else {
          console.log(
            `[deleteRatePlan] Replacement active row created pointing to Channex UUID-B: ${newChannexRatePlanId}`,
          );
        }
      }

      // D. Return success — user sees a clean state
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    console.error("[deleteRatePlan] Error:", err.message);
    return new Response(
      JSON.stringify({
        error:
          "An error occurred while deleting this rate plan, please try again later.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
