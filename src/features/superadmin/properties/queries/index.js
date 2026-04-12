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
