/**
 * src/features/superadmin/logs/supabase/recoveryApi.js
 *
 * Invokes the `recoverMissingBookings` Supabase Edge Function.
 * No React dependencies or UI state.
 */

import { supabase } from "@/lib/supabase";

/**
 * Trigger the recoverMissingBookings Edge Function.
 *
 * @param {Object} [params]
 * @param {boolean} [params.dryRun=false] - If true, previews without writing to the database
 * @param {string} [params.fromTs] - Optional ISO8601 timestamp override
 * @returns {Promise<{ ok: boolean, recovered: number, failed: number, skipped: number, dry_run: boolean, window_start: string, errors?: string[] }>}
 */
export async function triggerRecoverMissingBookings({ dryRun = false, fromTs } = {}) {
  const body = {
    dry_run: dryRun,
  };

  if (fromTs) {
    body.from_ts = fromTs;
  }

  const { data, error } = await supabase.functions.invoke("recoverMissingBookings", {
    body,
  });

  if (error) {
    console.error("[recoveryApi] Error invoking recoverMissingBookings:", error);
    throw new Error(error.message || "Failed to trigger booking recovery. Please try again.");
  }

  return data;
}
