import { supabase } from "@/lib/supabase";

/**
 * Fetch all room types for a property (by local Supabase property UUID).
 *
 * @param {string} propertyId - Local Supabase property UUID
 * @returns {Array} Room type rows
 */
export const getRoomTypesByProperty = async (propertyId) => {
  const { data, error } = await supabase
    .from("room_types")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch room types: ${error.message}`);
  return data || [];
};
