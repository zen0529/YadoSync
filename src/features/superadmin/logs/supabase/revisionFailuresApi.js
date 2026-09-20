/**
 * src/features/superadmin/logs/supabase/revisionFailuresApi.js
 *
 * Pure Supabase data fetcher for the `revision_failures` table.
 * No React dependencies or UI state.
 */

import { supabase } from "@/lib/supabase";

/**
 * Fetch a page of revision failure records with optional status filter, date range, and search.
 *
 * @param {Object} options
 * @param {number} [options.limit=50]
 * @param {number} [options.page=1]
 * @param {string} [options.statusFilter="all"] - "all" | "unresolved" | "resolved"
 * @param {string} [options.search=""]
 * @param {string} [options.startDate=""] - YYYY-MM-DD
 * @param {string} [options.endDate=""] - YYYY-MM-DD
 * @returns {Promise<{ data: Array, count: number }>}
 */
export async function fetchRevisionFailures({
  limit = 50,
  page = 1,
  statusFilter = "all",
  search = "",
  startDate = "",
  endDate = "",
} = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("revision_failures")
    .select("id, revision_id, booking_id, attempt_count, last_error, error_kind, first_failed_at, last_tried_at, resolved, resolved_at", { count: "exact" })
    .order("last_tried_at", { ascending: false })
    .range(from, to);

  if (statusFilter === "unresolved") {
    query = query.eq("resolved", false);
  } else if (statusFilter === "resolved") {
    query = query.eq("resolved", true);
  }

  if (startDate) {
    query = query.gte("first_failed_at", `${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    query = query.lte("first_failed_at", `${endDate}T23:59:59.999Z`);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(`revision_id.ilike.%${term}%,booking_id.ilike.%${term}%,last_error.ilike.%${term}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[revisionFailuresApi] Error fetching revision_failures:", error);
    throw new Error("Failed to load revision failures. Please try again.");
  }

  return { data: data ?? [], count: count ?? 0 };
}

/**
 * Check for unresolved failures that have exceeded the 30-minute feed window.
 * Used to display the active warning banner in the UI.
 *
 * @returns {Promise<{ count: number, earliestFailureAt: string | null }>}
 */
export async function fetchExpiredFailuresSummary() {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1_000).toISOString();

  const { data, count, error } = await supabase
    .from("revision_failures")
    .select("first_failed_at", { count: "exact" })
    .eq("resolved", false)
    .lt("first_failed_at", thirtyMinAgo)
    .order("first_failed_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[revisionFailuresApi] Error fetching expired failures summary:", error);
    return { count: 0, earliestFailureAt: null };
  }

  return {
    count: count ?? 0,
    earliestFailureAt: data?.[0]?.first_failed_at ?? null,
  };
}
