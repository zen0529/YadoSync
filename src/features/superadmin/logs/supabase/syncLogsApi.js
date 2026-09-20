/**
 * src/features/superadmin/logs/supabase/syncLogsApi.js
 *
 * Pure Supabase data fetcher for the `sync_logs` table.
 * No React dependencies or UI state.
 */

import { supabase } from "@/lib/supabase";

/**
 * Fetch a page of sync logs with optional type filter, date range, and search term.
 *
 * @param {Object} options
 * @param {number} [options.limit=50]
 * @param {number} [options.page=1]
 * @param {string} [options.typeFilter="all"]
 * @param {string} [options.search=""]
 * @param {string} [options.startDate=""] - YYYY-MM-DD
 * @param {string} [options.endDate=""] - YYYY-MM-DD
 * @returns {Promise<{ data: Array, count: number }>}
 */
export async function fetchSyncLogs({
  limit = 50,
  page = 1,
  typeFilter = "all",
  search = "",
  startDate = "",
  endDate = "",
} = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("sync_logs")
    .select("id, type, status, platform, message, payload, created_at, synced_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (typeFilter && typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(`message.ilike.%${term}%,type.ilike.%${term}%,platform.ilike.%${term}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[syncLogsApi] Error fetching sync_logs:", error);
    throw new Error("Failed to load sync logs. Please try again.");
  }

  return { data: data ?? [], count: count ?? 0 };
}
