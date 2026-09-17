import { supabase } from "@/lib/supabase";

/**
 * Fetches all properties with address details and bookings rollup data
 * for the superadmin commissions view.
 *
 * @returns {Promise<Array<Object>>} Array of property objects with booking stats
 */
export const getPropertyCommissions = async () => {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      location,
      owner_name,
      owner_email,
      owner_phone,
      commission_rate,
      total_commission,
      currency,
      status,
      created_at,
      property_address (
        address_line,
        city,
        state,
        country
      ),
      bookings (
        id,
        status,
        amount,
        commission_amount,
        currency
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("[getPropertyCommissions] query failed:", error);
    throw new Error(`Failed to fetch property commissions: ${error.message}`);
  }

  return (data || []).map((property) => {
    const validBookings = (property.bookings || []).filter(
      (b) => b.status === "new" || b.status === "modified"
    );

    const bookingCount = validBookings.length;
    const totalVolume = validBookings.reduce(
      (sum, b) => sum + (Number(b.amount) || 0),
      0
    );

    // If properties.total_commission is set, use it; otherwise compute from valid bookings
    const computedCommission = validBookings.reduce(
      (sum, b) => sum + (Number(b.commission_amount) || 0),
      0
    );
    const totalCommission =
      property.total_commission != null && property.total_commission > 0
        ? property.total_commission
        : computedCommission;

    const address = property.property_address;
    const formattedAddress = address
      ? [address.address_line, address.city, address.country].filter(Boolean).join(", ")
      : property.location || "No location";

    return {
      id: property.id,
      name: property.name || "Unnamed Property",
      location: formattedAddress,
      ownerName: property.owner_name || "Unknown",
      ownerEmail: property.owner_email || "—",
      ownerPhone: property.owner_phone || "—",
      commissionRate: property.commission_rate ?? 0,
      totalCommission: Number(totalCommission) || 0,
      totalVolume: Number(totalVolume) || 0,
      bookingCount,
      currency: property.currency || "PHP",
      status: property.status || "active",
      createdAt: property.created_at,
    };
  });
};
