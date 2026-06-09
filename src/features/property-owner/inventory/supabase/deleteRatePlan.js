import { supabase } from "@/lib/supabase";

/**
 * Deletes a rate plan row from Supabase.
 *
 * @param {string} localId - Local Supabase rate plan UUID
 */
export const deleteRatePlanFromDB = async (localId) => {
  const { error } = await supabase
    .from("rate_plans")
    .delete()
    .eq("id", localId);

  if (error) throw new Error(`Failed to delete rate plan: ${error.message}`);
};
