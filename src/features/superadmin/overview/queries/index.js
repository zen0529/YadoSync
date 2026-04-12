import { supabase } from "@/lib/supabase";

/** Fetch aggregate stats for admin overview */
export const getAdminStats = async () => {
  const [propertiesRes, bookingsRes, ownersRes] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "owner"),
  ]);

  if (propertiesRes.error) throw propertiesRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (ownersRes.error) throw ownersRes.error;

  return {
    totalProperties: propertiesRes.count || 0,
    totalBookings: bookingsRes.count || 0,
    totalOwners: ownersRes.count || 0,
  };
};

/** Fetch all bookings with property and owner info */
export const getAllBookings = async ({ platform, propertyId, ownerId } = {}) => {
  let query = supabase
    .from("bookings")
    .select("*, properties(name, owner_name, user_id, commission_rate)")
    .order("booked_at", { ascending: false });

  if (platform) query = query.eq("platform", platform);
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;
  if (error) throw error;

  let results = data || [];
  if (ownerId) {
    results = results.filter((b) => b.properties?.user_id === ownerId);
  }

  return results;
};
