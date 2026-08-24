import { supabase } from "@/lib/supabase";

/** Fetch bookings with optional filters */
export const getBookings = async ({ propertyId, otaName } = {}) => {
  let query = supabase
    .from("bookings")
    .select(`
      id,
      channex_booking_id,
      ota_name,
      ota_reservation_code,
      status,
      guest_name,
      guest_email,
      guest_phone,
      room_type_id,
      check_in,
      check_out,
      amount,
      currency,
      notes,
      booked_at,
      created_at,
      updated_at,
      properties ( id, name )
    `)
    .order("check_in", { ascending: false });

  if (propertyId) query = query.eq("property_id", propertyId);
  if (otaName)    query = query.eq("ota_name", otaName);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

/** Fetch a single booking by its Supabase ID */
export const getBooking = async (bookingId) => {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      properties ( id, name )
    `)
    .eq("id", bookingId)
    .single();

  if (error) throw error;
  return data;
};
