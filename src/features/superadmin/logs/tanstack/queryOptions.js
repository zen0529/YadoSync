/**
 * src/features/superadmin/logs/tanstack/queryOptions.js
 *
 * Query options and caching policy for system logs:
 * - 30 seconds stale time (instant tab switching without refetches)
 * - 60 seconds refetch interval (auto-polling matching the 1-minute poller cycle)
 */

export const LOGS_QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
};
