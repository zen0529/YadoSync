import { supabase } from "@/lib/supabase";

/** Fetch all properties with platform connections and booking counts */
export const getAllProperties = async () => {
  const { data, error } = await supabase
    .from("properties")
    .select("*, platform_connection(platform), bookings(id), users(full_name, email)")
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
    userId: p.user_id,
    createdAt: p.created_at,
  }));
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

/** Fetch all users with role = 'owner' */
export const getAllOwners = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_at")
    .eq("role", "owner")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

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
