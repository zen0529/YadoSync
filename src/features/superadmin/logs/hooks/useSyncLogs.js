/**
 * src/features/superadmin/logs/hooks/useSyncLogs.js
 *
 * TanStack Query hook bridging UI to syncLogsApi.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchSyncLogs } from "../supabase/syncLogsApi";
import { logsKeys } from "../tanstack/queryKeys";
import { LOGS_QUERY_OPTIONS } from "../tanstack/queryOptions";

export function useSyncLogs({
  page = 1,
  limit = 50,
  typeFilter = "all",
  search = "",
  startDate = "",
  endDate = "",
} = {}) {
  const query = useQuery({
    queryKey: logsKeys.syncLogs({ page, limit, typeFilter, search, startDate, endDate }),
    queryFn: () => fetchSyncLogs({ page, limit, typeFilter, search, startDate, endDate }),
    ...LOGS_QUERY_OPTIONS,
  });

  return {
    logs: query.data?.data ?? [],
    totalCount: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error.message || "Failed to load sync logs") : null,
    refetch: query.refetch,
  };
}
