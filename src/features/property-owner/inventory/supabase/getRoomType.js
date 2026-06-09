import { supabase } from "@/lib/supabase";

/**
 * Fetch a single room type by its ID.
 *
 * @param {string} roomTypeId - Local Supabase room type UUID
 * @returns {Object} Room type row
 */
export const getRoomTypeById = async (roomTypeId) => {
  // Fetch the room type row
  const { data, error } = await supabase
    .from("room_types")
    .select("*")
    .eq("id", roomTypeId)
    .single();

  if (error) throw new Error(`Failed to fetch room type: ${error.message}`);

  // Fetch photos separately — avoids needing a FK constraint on room_type_id
  const { data: photos, error: photosError } = await supabase
    .from("property_photos")
    .select("id, url, description, position, channex_photo_id")
    .eq("room_type_id", roomTypeId)
    .order("position", { ascending: true });

  if (photosError) {
    console.error("[DEBUG] Failed to fetch room type photos:", photosError.message);
  }

  return { ...data, photos: photos || [] };
};
