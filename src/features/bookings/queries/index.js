import { supabase } from "@/lib/supabase";

/** Fetch all bookings with optional filters */
export const getBookings = async ({ platform, propertyId } = {}) => {
  let query = supabase
    .from("bookings")
    .select("*, properties(name)")
    .order("booked_at", { ascending: false });

  if (platform) query = query.eq("platform", platform);
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/** Fetch a single booking by ID */
export const getBooking = async (bookingId) => {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, properties(name, owner_name, owner_email, owner_phone)")
    .eq("id", bookingId)
    .single();

  if (error) throw error;
  return data;
};

/** Invoke the sync-availability Edge Function to block dates across platforms */
export const syncAvailability = async (propertyId, checkIn, checkOut) => {
  const { data, error } = await supabase.functions.invoke("sync-availability", {
    body: { propertyId, checkIn, checkOut },
  });

  if (error) throw error;
  return data;
};

/** Fetch sync logs for a booking */
export const getSyncLogs = async (bookingId) => {
  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("booking_id", bookingId)
    .order("synced_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/** Invoke the send-notification Edge Function */
export const sendNotification = async (bookingId, propertyId) => {
  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: { bookingId, propertyId },
  });

  if (error) throw error;
  return data;
};

/** Fetch notification logs for a property or booking */
export const getNotifications = async ({ propertyId, bookingId } = {}) => {
  let query = supabase
    .from("notifications")
    .select("*")
    .order("sent_at", { ascending: false });

  if (propertyId) query = query.eq("property_id", propertyId);
  if (bookingId) query = query.eq("booking_id", bookingId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};
