import { supabase } from "@/lib/supabase";

/**
 * Get count of connected platforms for a user (used by sidebar badge)
 * @param {string} userId
 */
export const getConnectedCount = async (userId) => {
  const { data: prop } = await supabase
    .from("properties")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!prop) return 0;

  const { count } = await supabase
    .from("platform_connections")
    .select("id", { count: "exact", head: true })
    .eq("property_id", prop.id)
    .eq("connection_status", "connected");
  return count || 0;
};
