import { supabase } from "@/lib/supabase";

/**
 * Fetch room types and rate plans for a given property in parallel.
 * @param {string} propertyId
 * @returns {Promise<{ rooms: Array, plans: Array }>}
 */
export const getRoomTypesAndRatePlans = async (propertyId) => {
  const [{ data: rooms, error: roomsError }, { data: plans, error: plansError }] =
    await Promise.all([
      supabase
        .from("room_types")
        .select("id, title, count_of_rooms, channex_room_type_id")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true }),
      supabase
        .from("rate_plans")
        .select(
          "id, title, room_type_id, channex_rate_plan_id, currency, sell_mode, room_types(title)",
        )
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true }),
    ]);

  if (roomsError) throw roomsError;
  if (plansError) throw plansError;

  return { rooms: rooms ?? [], plans: plans ?? [] };
};
