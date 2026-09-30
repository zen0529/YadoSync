interface NotificationClient {
  rpc(name: string): PromiseLike<{ error: unknown }>;
}

/** Best-effort delivery; incident state in Postgres retries a failed dispatch next cycle. */
export async function dispatchSyncNotifications(supabase: NotificationClient): Promise<void> {
  try {
    const { error } = await supabase.rpc("dispatch_booking_sync_notifications");
    if (error) console.error("[bookingSyncNotifications] Dispatch failed:", error);
  } catch (error) {
    console.error("[bookingSyncNotifications] Dispatch failed:", error);
  }
}
