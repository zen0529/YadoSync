/**
 * src/features/property-owner/notifications/supabase/fetchNotifications.js
 *
 * Pure Supabase query to fetch notifications for a property, ordered newest first.
 */

import { supabase } from "@/lib/supabase";

/**
 * Fetch notifications for a property, ordered newest first.
 *
 * @param {Object} options
 * @param {string} options.propertyId
 * @param {number} [options.limit=20]
 * @returns {Promise<Array>}
 */
export async function fetchNotifications({ propertyId, limit = 20 }) {
  if (!propertyId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, property_id, booking_id, type, channel, status, message, created_at, sent_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchNotifications] Error fetching notifications:", error);
    throw new Error("Failed to load notifications.");
  }

  return data ?? [];
}
