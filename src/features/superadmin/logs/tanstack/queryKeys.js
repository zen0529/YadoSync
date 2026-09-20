/**
 * src/features/superadmin/logs/tanstack/queryKeys.js
 *
 * TanStack Query key factory for the Superadmin System Logs feature.
 */

export const logsKeys = {
  all: ["system-logs"],
  syncLogs: (filters = {}) => ["system-logs", "sync", filters],
  revisionFailures: (filters = {}) => ["system-logs", "failures", filters],
  activeFailuresCount: () => ["system-logs", "active-failures-count"],
};
