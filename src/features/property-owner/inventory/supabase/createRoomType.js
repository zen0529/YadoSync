import { supabase } from "@/lib/supabase";

/**
 * Inserts a new room type row into Supabase after Channex creation.
 *
 * @param {string} propertyId           - Local Supabase property UUID
 * @param {string} channexRoomTypeId    - Channex room type UUID
 * @param {object} form                 - Room type form values
 * @returns {object} Inserted row
 */
export const insertRoomType = async (propertyId, channexRoomTypeId, form) => {
  const { data, error } = await supabase
    .from("room_types")
    .insert([{
      property_id: propertyId,
      channex_room_type_id: channexRoomTypeId,
      title: form.title,
      count_of_rooms: Number(form.count_of_rooms) || 1,
      occ_adults: Number(form.occ_adults) || 2,
      occ_children: Number(form.occ_children) || 0,
      occ_infants: Number(form.occ_infants) || 0,
      default_occupancy: Number(form.default_occupancy) || 2,
      capacity: Number(form.capacity) || null,
      room_kind: form.room_kind || "room",
      content_description: form.description || null,
    }])
    .select("*")
    .single();

  if (error) throw new Error(`Failed to save room type: ${error.message}`);

  // Insert photos into property_photos if they exist
  if (form.content?.photos?.length > 0) {
    const photosToInsert = form.content.photos.map(photo => ({
      property_id: propertyId,
      room_type_id: data.id,
      channex_photo_id: photo.id || null,
      url: photo.url,
      position: photo.position || 0,
      description: photo.description || null
    }));

    const { error: photosError } = await supabase
      .from("property_photos")
      .insert(photosToInsert);
      
    if (photosError) {
      console.error("[DEBUG] Failed to insert room type photos:", photosError.message);
    }
  }

  return data;
};
