import { supabase } from "@/lib/supabase";

export const getProperties = async (searchQuery = "", statusFilter = "all") => {
  let query = supabase
    .from("properties")
    .select(`
      *,
      property_address (
        address_line,
        city,
        state,
        country
      )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq('status', statusFilter);
  }

  if (searchQuery) {
    // You can search multiple columns using .or()
    query = query.or(`name.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%,owner_email.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[DEBUG] Failed to fetch properties:", error);
    throw new Error(`Failed to fetch properties: ${error.message}`);
  }

  return data;
};
