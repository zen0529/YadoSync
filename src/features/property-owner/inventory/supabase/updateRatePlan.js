import { supabase } from "@/lib/supabase";

/**
 * Updates an existing rate plan row in Supabase.
 *
 * @param {string} localId - Local Supabase rate plan UUID
 * @param {object} form    - Updated form values
 * @returns {object} Updated row
 */
export const updateRatePlanInDB = async (localId, form) => {
  const { data, error } = await supabase
    .from("rate_plans")
    .update({
      title:     form.title,
      currency:  form.currency || "PHP",
      sell_mode: form.sell_mode || "per_room",
      rate_mode: form.rate_mode || "manual",
    })
    .eq("id", localId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update rate plan: ${error.message}`);
  return data;
};
