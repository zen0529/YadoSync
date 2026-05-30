import { supabase } from "@/lib/supabase";

export const getProperty = async (propertyId) => {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      property_address (
        address_line,
        city,
        state,
        country,
        postcode,
        latitude,
        longitude
      ),
      property_photos (
        id,
        url,
        description,
        position,
        channex_photo_id
      )
    `)
    .eq("id", propertyId)
    .single();

  console.log(
    "[DEBUG] Property data:", data
  )

  if (error) {
    console.error("[DEBUG] Failed to fetch property:", error);
    throw new Error(`Failed to fetch property details: ${error.message}`);
  }

  return data;
};
