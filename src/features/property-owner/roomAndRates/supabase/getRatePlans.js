import { supabase } from "@/lib/supabase";

/**
 * Fetch all rate plans for a property, joined with room type title.
 *
 * @param {string} propertyId - Local Supabase property UUID
 * @returns {Array} Rate plan rows with room_types info
 */
export const getRatePlansByProperty = async (propertyId) => {
  const { data, error } = await supabase
    .from("rate_plans")
    .select(`
      *,
      room_types (
        id,
        title,
        channex_room_type_id
      )
    `)
    .eq("property_id", propertyId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch rate plans: ${error.message}`);
  return data || [];
};

/**
 * Fetch active rate plans for a specific room type (used for lazy cascading dropdown).
 *
 * @param {string} roomTypeId - Local Supabase room type UUID
 * @returns {Array} Rate plan rows for that room type
 */
export const getRatePlansByRoomType = async (roomTypeId) => {
  const { data, error } = await supabase
    .from("rate_plans")
    .select("id, title, options, room_type_id")
    .eq("room_type_id", roomTypeId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch rate plans: ${error.message}`);
  return data || [];
};
