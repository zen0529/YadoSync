import { supabase } from "@/lib/supabase";

/** Fetch the current user's property (id + beds24 status) */
export const getMyProperty = async (userId) => {
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, beds24_property_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/** Fetch all platform connections for a property */
export const getConnections = async (propertyId) => {
  const { data, error } = await supabase
    .from("platform_connection")
    .select("*")
    .eq("property_id", propertyId);
  if (error) throw error;
  return data || [];
};

/** Connect a platform — upserts by property_id + platform */
export const connectPlatform = async ({ propertyId, platform, externalPropertyId }) => {
  const { data: existing } = await supabase
    .from("platform_connection")
    .select("id")
    .eq("property_id", propertyId)
    .eq("platform", platform)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("platform_connection")
      .update({
        external_property_id: externalPropertyId,
        connection_status: "connected",
        connected_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("platform_connection")
      .insert({
        property_id: propertyId,
        platform,
        external_property_id: externalPropertyId,
        connection_status: "connected",
        connected_at: new Date().toISOString(),
      });
    if (error) throw error;
  }
};

/** Disconnect a platform */
export const disconnectPlatform = async ({ propertyId, platform }) => {
  const { error } = await supabase
    .from("platform_connection")
    .update({ connection_status: "disconnected" })
    .eq("property_id", propertyId)
    .eq("platform", platform);
  if (error) throw error;
};

/** Get count of connected platforms for a user (used by sidebar badge) */
export const getConnectedCount = async (userId) => {
  const { data: prop } = await supabase
    .from("properties")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!prop) return 0;

  const { count } = await supabase
    .from("platform_connection")
    .select("id", { count: "exact", head: true })
    .eq("property_id", prop.id)
    .eq("connection_status", "connected");
  return count || 0;
};
