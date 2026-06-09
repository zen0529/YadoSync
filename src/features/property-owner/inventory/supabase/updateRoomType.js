import { supabase } from "@/lib/supabase";

/**
 * Updates an existing room type row in Supabase.
 *
 * @param {string} id   - Local Supabase room type UUID
 * @param {object} form - Updated room type form values
 * @returns {object} Updated row
 */
export const updateRoomTypeInDB = async (id, propertyId, form) => {
  const payload = {
    title: form.title,
    count_of_rooms: Number(form.count_of_rooms) || 1,
    occ_adults: Number(form.occ_adults) || 2,
    occ_children: Number(form.occ_children) || 0,
    occ_infants: Number(form.occ_infants) || 0,
    default_occupancy: Number(form.default_occupancy) || 2,
    capacity: Number(form.capacity) || null,
    room_kind: form.room_kind || "room",
    content_description: form.description || null,
  };

  if (form.channex_room_type_id) {
    payload.channex_room_type_id = form.channex_room_type_id;
  }

  const { data, error } = await supabase
    .from("room_types")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update room type: ${error.message}`);

  // Update photos: delete existing for this room type, then insert new
  if (form.content?.photos !== undefined) {
    const { error: deleteError } = await supabase
      .from("property_photos")
      .delete()
      .eq("room_type_id", id);

    if (deleteError) {
      console.error("[DEBUG] Failed to delete old room type photos:", deleteError.message);
    } else if (form.content.photos.length > 0) {
      const photosToInsert = form.content.photos.map(photo => ({
        property_id: propertyId,
        room_type_id: id,
        channex_photo_id: photo.id || null,
        url: photo.url,
        position: photo.position || 0,
        description: photo.description || null
      }));

      const { error: insertError } = await supabase
        .from("property_photos")
        .insert(photosToInsert);

      if (insertError) {
        console.error("[DEBUG] Failed to insert new room type photos:", insertError.message);
      }
    }
  }

  return data;
};
