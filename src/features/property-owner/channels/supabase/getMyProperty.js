import { supabase } from "@/lib/supabase";

/**
 * Fetch the current user's property (id + channex_property_id)
 * @param {string} userId
 */
export const getMyProperty = async (userId) => {
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, channex_property_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
