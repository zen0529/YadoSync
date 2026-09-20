/**
 * src/features/superadmin/logs/components/RevisionFailuresTable.jsx
 *
 * Table presentation for `revision_failures` records.
 */

import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime, timeAgo } from "../utils/formatters";

export function RevisionFailuresTable({
  failures,
  totalCount,
  page,
  limit,
  onPageChange,
  isLoading,
}) {
  const totalPages = Math.ceil(totalCount / limit) || 1;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    );
  }

  if (failures.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mx-auto" />
        <h4 className="text-sm font-semibold text-foreground">No revision failures recorded</h4>
        <p className="text-xs text-muted-foreground">
          All booking revisions are being processed cleanly by the feed poller.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-[110px]">Status</th>
                <th className="py-3 px-4 w-[180px]">Booking / Revision</th>
                <th className="py-3 px-4 w-[90px]">Attempts</th>
                <th className="py-3 px-4 w-[100px]">Kind</th>
                <th className="py-3 px-4 w-[160px]">First Failed</th>
                <th className="py-3 px-4 w-[160px]">Last Attempt</th>
                <th className="py-3 px-4">Last Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {failures.map((f) => (
                <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                  {/* Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {f.resolved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <AlertCircle className="h-3 w-3" />
                        <span>Unresolved</span>
                      </span>
                    )}
                  </td>

                  {/* Booking ID & Revision ID */}
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="font-semibold text-foreground truncate max-w-[170px]" title={f.booking_id}>
                      {f.booking_id || "No booking ID"}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[170px]" title={f.revision_id}>
                      rev: {f.revision_id}
                    </div>
                  </td>

                  {/* Attempts Count */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        f.attempt_count > 10
                          ? "bg-rose-500/20 text-rose-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {f.attempt_count}
                    </span>
                  </td>

                  {/* Error Kind */}
                  <td className="py-3 px-4 capitalize font-medium text-foreground">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        f.error_kind === "permanent"
                          ? "bg-rose-500/15 text-rose-500"
                          : "bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {f.error_kind || "transient"}
                    </span>
                  </td>

                  {/* First Failed At */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">{formatDateTime(f.first_failed_at)}</div>
                    <div className="text-[10px] text-muted-foreground">{timeAgo(f.first_failed_at)}</div>
                  </td>

                  {/* Last Attempt */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">{formatDateTime(f.last_tried_at)}</div>
                    <div className="text-[10px] text-muted-foreground">{timeAgo(f.last_tried_at)}</div>
                  </td>

                  {/* Last Error Message */}
                  <td className="py-3 px-4 text-foreground/90 max-w-sm truncate" title={f.last_error}>
                    {f.last_error || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <div>
          Showing <span className="font-semibold text-foreground">{failures.length}</span> of{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> failure records
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 px-2.5 text-xs flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </Button>

          <span className="px-2 font-medium text-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 px-2.5 text-xs flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
