import { supabase } from "@/lib/supabase";

/**
 * Extracts a readable error message from a Supabase FunctionsHttpError.
 */
const parseEdgeFunctionError = async (error) => {
  if (!error) return "Something went wrong. Please try again.";
  try {
    if (error.context && typeof error.context.json === "function") {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch {
    // fallback
  }
  return error.message || "Something went wrong. Please try again.";
};

/**
 * Fetch Channex-side room types and rate plans for a property.
 *
 * Calls the `getChannexInventory` edge function which makes two Channex GET
 * requests in parallel:
 *   GET /room_types/options?filter[property_id]={channex_property_id}
 *   GET /rate_plans/options?filter[property_id]={channex_property_id}&multi_occupancy=true
 *
 * @param {string} channexPropertyId  - Channex property UUID (stored on the property row)
 * @returns {{ roomTypes: Array, ratePlans: Array }}
 */
export const getChannexInventory = async (channexPropertyId) => {
  const { data, error } = await supabase.functions.invoke("getChannexInventory", {
    body: { channex_property_id: channexPropertyId },
  });

  if (error) throw new Error(await parseEdgeFunctionError(error));
  if (data?.error) throw new Error(data.error);

  return {
    roomTypes: data?.roomTypes ?? [],
    ratePlans: data?.ratePlans ?? [],
  };
};
