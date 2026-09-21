/**
 * src/features/property-owner/notifications/supabase/markNotificationAsRead.js
 *
 * Pure Supabase mutation to mark a single notification as read.
 */

import { supabase } from "@/lib/supabase";

/**
 * Mark a single notification as read.
 *
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;

  const { error } = await supabase
    .from("notifications")
    .update({ status: "read" })
    .eq("id", notificationId);

  if (error) {
    console.error("[markNotificationAsRead] Error marking notification as read:", error);
    throw new Error("Failed to update notification.");
  }
}
