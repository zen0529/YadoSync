import { supabase } from "@/lib/supabase";

export const updateProperty = async (id, propertyData, addressData = null, photosData = null) => {
  const { data, error } = await supabase
    .from("properties")
    .update(propertyData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (addressData) {
    const { error: addressError } = await supabase
      .from("property_address")
      .update(addressData)
      .eq("property_id", id);

    if (addressError) {
      console.error("[DEBUG] Failed to update address in Supabase:", addressError);
    }
  }

  if (photosData !== null) {
    const { error: deleteError } = await supabase
      .from("property_photos")
      .delete()
      .eq("property_id", id);
      
    if (deleteError) {
      console.error("[DEBUG] Failed to delete old photos:", deleteError);
    } else if (photosData.length > 0) {
      const photosToInsert = photosData.map(photo => ({
        property_id: id,
        channex_photo_id: photo.id,
        url: photo.url,
        position: photo.position || 0,
        description: photo.description || null
      }));

      const { error: insertError } = await supabase
        .from("property_photos")
        .insert(photosToInsert);
        
      if (insertError) {
        console.error("[DEBUG] Failed to insert new photos:", insertError);
      }
    }
  }

  return data;
};
