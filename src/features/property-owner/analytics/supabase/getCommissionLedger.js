import { supabase } from "@/lib/supabase";

/**
 * Fetch confirmed + modified bookings that have a commission_amount,
 * ordered by most recent check_in.
 *
 * Used by the Commission Ledger on the AnalyticsPage.
 *
 * @param {Object}  options
 * @param {string}  [options.propertyId]  Restrict to a single property (owner view)
 * @param {number}  [options.limit=50]    Max rows to return
 */
export const getCommissionLedger = async ({ propertyId, limit = 50 } = {}) => {
  let query = supabase
    .from("bookings")
    .select(`
      id,
      channex_booking_id,
      guest_name,
      ota_name,
      check_in,
      check_out,
      amount,
      commission_amount,
      currency,
      status,
      booked_at,
      properties ( id, name, commission_rate )
    `)
    .in("status", ["new", "modified"])
    .not("commission_amount", "is", null)
    .order("check_in", { ascending: false })
    .limit(limit);

  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};
