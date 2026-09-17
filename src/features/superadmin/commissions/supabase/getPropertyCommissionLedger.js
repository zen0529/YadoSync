import { supabase } from "@/lib/supabase";

/**
 * Fetches all confirmed and modified bookings for a specific property
 * to display in the commission ledger drill-down modal.
 *
 * @param {string} propertyId The UUID of the property
 * @returns {Promise<Array<Object>>} Array of booking ledger entries
 */
export const getPropertyCommissionLedger = async (propertyId) => {
  if (!propertyId) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      channex_booking_id,
      ota_reservation_code,
      guest_name,
      guest_email,
      ota_name,
      check_in,
      check_out,
      amount,
      commission_amount,
      currency,
      status,
      booked_at,
      properties (
        id,
        name,
        commission_rate
      )
    `)
    .eq("property_id", propertyId)
    .in("status", ["new", "modified"])
    .order("check_in", { ascending: false });

  if (error) {
    console.error(`[getPropertyCommissionLedger] query failed for ${propertyId}:`, error);
    throw new Error(`Failed to fetch booking ledger: ${error.message}`);
  }

  return data || [];
};
