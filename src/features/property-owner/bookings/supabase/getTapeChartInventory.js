import { supabase } from "@/lib/supabase";

export const getTapeChartInventory = async (propertyId) => {
  const [{ data: roomTypes, error: roomError }, { data: ratePlans, error: planError }] =
    await Promise.all([
      supabase
        .from("room_types")
        .select("id, title, count_of_rooms, channex_room_type_id")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true }),
      supabase
        .from("rate_plans")
        .select("id, title, room_type_id, channex_rate_plan_id")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true }),
    ]);

  if (roomError) throw roomError;
  if (planError) throw planError;
  return { roomTypes: roomTypes ?? [], ratePlans: ratePlans ?? [] };
};
