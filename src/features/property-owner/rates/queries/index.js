import { supabase } from "@/lib/supabase";

/**
 * Fetch rate plans for a property owner.
 * Joins properties (to filter by user_id) and room_types (for display).
 *
 * @param {string} userId - Supabase auth user ID
 * @returns {Array} Rate plan rows with room_type info, grouped by room type
 */
export const getRatePlansForOwner = async (userId) => {
  // First, get the owner's property
  const { data: propData, error: propError } = await supabase
    .from("properties")
    .select("id, name, channex_property_id")
    .eq("user_id", userId)
    .single();

  if (propError && propError.code !== "PGRST116") {
    throw new Error(`Failed to fetch property: ${propError.message}`);
  }

  if (!propData) return { property: null, ratePlans: [] };

  // Then fetch rate plans for this property
  const { data, error } = await supabase
    .from("rate_plans")
    .select(`
      *,
      room_types (
        id,
        title,
        count_of_rooms,
        occ_adults
      )
    `)
    .eq("property_id", propData.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch rate plans: ${error.message}`);

  return {
    property: propData,
    ratePlans: data || [],
  };
};
