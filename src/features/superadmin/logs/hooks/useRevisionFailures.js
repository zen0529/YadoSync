/**
 * src/features/superadmin/logs/hooks/useRevisionFailures.js
 *
 * TanStack Query hook bridging UI to revisionFailuresApi.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchRevisionFailures, fetchExpiredFailuresSummary } from "../supabase/revisionFailuresApi";
import { logsKeys } from "../tanstack/queryKeys";
import { LOGS_QUERY_OPTIONS } from "../tanstack/queryOptions";

export function useRevisionFailures({
  page = 1,
  limit = 50,
  statusFilter = "all",
  search = "",
  startDate = "",
  endDate = "",
} = {}) {
  const failuresQuery = useQuery({
    queryKey: logsKeys.revisionFailures({ page, limit, statusFilter, search, startDate, endDate }),
    queryFn: () => fetchRevisionFailures({ page, limit, statusFilter, search, startDate, endDate }),
    ...LOGS_QUERY_OPTIONS,
  });

  const alertSummaryQuery = useQuery({
    queryKey: logsKeys.activeFailuresCount(),
    queryFn: fetchExpiredFailuresSummary,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return {
    failures: failuresQuery.data?.data ?? [],
    totalCount: failuresQuery.data?.count ?? 0,
    isLoading: failuresQuery.isLoading,
    isFetching: failuresQuery.isFetching,
    error: failuresQuery.error ? (failuresQuery.error.message || "Failed to load revision failures") : null,
    refetch: failuresQuery.refetch,

    // Active alert banner data
    expiredCount: alertSummaryQuery.data?.count ?? 0,
    earliestFailureAt: alertSummaryQuery.data?.earliestFailureAt ?? null,
    isAlertLoading: alertSummaryQuery.isLoading,
  };
}
