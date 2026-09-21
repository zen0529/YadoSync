/**
 * src/features/property-owner/notifications/supabase/markAllNotificationsAsRead.js
 *
 * Pure Supabase mutation to mark all unread notifications for a property as read.
 */

import { supabase } from "@/lib/supabase";

/**
 * Mark all unread notifications for a property as read.
 *
 * @param {string} propertyId
 * @returns {Promise<void>}
 */
export async function markAllNotificationsAsRead(propertyId) {
  if (!propertyId) return;

  const { error } = await supabase
    .from("notifications")
    .update({ status: "read" })
    .eq("property_id", propertyId)
    .eq("status", "unread");

  if (error) {
    console.error("[markAllNotificationsAsRead] Error marking all notifications as read:", error);
    throw new Error("Failed to update notifications.");
  }
}
