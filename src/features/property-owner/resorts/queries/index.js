import { supabase } from "@/lib/supabase";

/** Fetch all properties with their platform connections and booking counts */
export const getProperties = async () => {
  const { data, error } = await supabase
    .from("properties")
    .select("*, platform_connection(platform), bookings(id)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    location: p.location,
    ownerName: p.owner_name,
    ownerEmail: p.owner_email,
    ownerPhone: p.owner_phone,
    commissionRate: p.commission_rate,
    status: p.status,
    platforms: p.platform_connection?.map((c) => c.platform) || [],
    bookingCount: p.bookings?.length || 0,
    createdAt: p.created_at,
  }));
};

/** Create a new property and its platform connections */
export const createProperty = async (userId, { name, location, ownerName, ownerEmail, ownerPhone, commissionRate, platforms }) => {
  const { data: property, error: propError } = await supabase
    .from("properties")
    .insert({
      user_id: userId,
      name,
      location,
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      commission_rate: parseFloat(commissionRate) || 0,
      status: "active",
    })
    .select()
    .single();

  if (propError) throw propError;

  if (platforms.length > 0) {
    const connections = platforms.map((platform) => ({
      property_id: property.id,
      platform,
      connection_status: "connected",
    }));

    const { error: connError } = await supabase
      .from("platform_connection")
      .insert(connections);

    if (connError) throw connError;
  }

  return property;
};

/** Update an existing property and sync its platform connections */
export const updateProperty = async (propertyId, { name, location, ownerName, ownerEmail, ownerPhone, commissionRate, status, platforms }) => {
  const { data: property, error: propError } = await supabase
    .from("properties")
    .update({
      name,
      location,
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      commission_rate: parseFloat(commissionRate) || 0,
      status,
    })
    .eq("id", propertyId)
    .select()
    .single();

  if (propError) throw propError;

  // Replace platform connections: delete old, insert new
  const { error: delError } = await supabase
    .from("platform_connection")
    .delete()
    .eq("property_id", propertyId);

  if (delError) throw delError;

  if (platforms.length > 0) {
    const connections = platforms.map((platform) => ({
      property_id: propertyId,
      platform,
      connection_status: "connected",
    }));

    const { error: connError } = await supabase
      .from("platform_connection")
      .insert(connections);

    if (connError) throw connError;
  }

  return property;
};
