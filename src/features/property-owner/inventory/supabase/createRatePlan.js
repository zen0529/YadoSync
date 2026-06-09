import { supabase } from "@/lib/supabase";

/**
 * Inserts a new rate plan row into Supabase after Channex creation.
 *
 * @param {string} propertyId        - Local Supabase property UUID
 * @param {string} roomTypeId        - Local Supabase room_type UUID
 * @param {string} channexRatePlanId - Channex rate plan UUID
 * @param {object} form              - Rate plan form values
 * @returns {object} Inserted row
 */
export const insertRatePlan = async (propertyId, roomTypeId, channexRatePlanId, form) => {
  const { data, error } = await supabase
    .from("rate_plans")
    .insert([{
      property_id:          propertyId,
      room_type_id:         roomTypeId,
      channex_rate_plan_id: channexRatePlanId,
      title:                form.title,
      currency:             form.currency || "PHP",
      sell_mode:            form.sell_mode || "per_room",
      rate_mode:            form.rate_mode || "manual",
    }])
    .select("*")
    .single();

  if (error) throw new Error(`Failed to save rate plan: ${error.message}`);
  return data;
};
