import { supabase } from "@/lib/supabase";

/**
 * Fetch all platform connections for a property
 * @param {string} propertyId
 */
export const getConnections = async (propertyId) => {
  const { data, error } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("property_id", propertyId);
  if (error) throw error;
  return data || [];
};
