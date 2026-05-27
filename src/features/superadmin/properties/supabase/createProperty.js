import { supabase } from "@/lib/supabase";

export const createProperty = async (channexResult, userId) => {
  const propertyData = channexResult.data;
  const attrs = propertyData.attributes;

  // 1. Insert Core Property
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert([{
      user_id: userId,
      channex_property_id: propertyData.id,
      name: attrs.title,
      status: attrs.is_active ? "active" : "inactive",
      owner_email: attrs.email,
      owner_phone: attrs.phone,
      owner_name: attrs.owner_name || "",
      currency: attrs.currency,
      property_type: attrs.property_type,
      commission_rate: attrs.commission_rate || 15,
      channex_settings: attrs.settings || {}
    }])
    .select("id")
    .single();

  if (propertyError) {
    console.error("[DEBUG] Supabase Insert Error details:", propertyError);
    throw new Error(`Failed to save property to Supabase: ${propertyError.message}`);
  }

  const localPropertyId = property.id;

  // 1.5 Insert Address
  const { error: addressError } = await supabase
    .from("property_address")
    .insert([{
      property_id: localPropertyId,
      address_line: attrs.address || null,
      city: attrs.city || null,
      state: attrs.state || null,
      country: attrs.country || null,
      postcode: attrs.zip_code || null,
      latitude: attrs.latitude || null,
      longitude: attrs.longitude || null
    }]);

  if (addressError) {
    console.error("[DEBUG] Failed to insert property address:", addressError.message);
  }

  // 2. Insert Photos
  const photos = attrs.content?.photos || [];
  if (photos.length > 0) {
    const photosToInsert = photos.map(photo => ({
      property_id: localPropertyId,
      channex_photo_id: photo.id,
      url: photo.url,
      position: photo.position || 0,
      description: photo.description || null
    }));

    const { error: photosError } = await supabase
      .from("property_photos")
      .insert(photosToInsert);

    if (photosError) console.error("[DEBUG] Failed to insert property photos:", photosError.message);
  }

  // 3. Upsert Groups & Assignments
  const groups = channexResult.data.relationships?.groups?.data || [];
  if (groups.length > 0) {
    for (const group of groups) {
      // Upsert the group based on channex_group_id
      const { data: savedGroup, error: groupError } = await supabase
        .from("property_groups")
        .upsert({
          channex_group_id: group.id,
          title: group.attributes?.title || "Unknown Group"
        }, { onConflict: "channex_group_id" })
        .select("id")
        .single();

      if (groupError) {
        console.error(`[DEBUG] Failed to upsert group ${group.id}:`, groupError.message);
        continue;
      }

      // Insert assignment
      const { error: assignmentError } = await supabase
        .from("property_group_assignments")
        .insert({
          property_id: localPropertyId,
          group_id: savedGroup.id
        });

      if (assignmentError) {
        console.error(`[DEBUG] Failed to assign property to group ${group.id}:`, assignmentError.message);
      }
    }
  }

  return property;
};
