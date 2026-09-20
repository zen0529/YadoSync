/**
 * src/features/superadmin/logs/components/ActiveFailuresAlert.jsx
 *
 * Prominent warning banner displayed when one or more booking revisions
 * have exceeded the 30-minute Channex feed window and need manual recovery.
 */

import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { timeAgo, formatDateTime } from "../utils/formatters";

export function ActiveFailuresAlert({ count, earliestFailureAt, onTriggerRecovery }) {
  if (!count || count <= 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-4 sm:p-5 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-amber-500/20 p-2 text-amber-500 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>{count} booking{count === 1 ? "" : "s"} expired from Channex feed</span>
              <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Action Required
              </span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These revisions were not acknowledged within 30 minutes and dropped out of the real-time queue.
              {earliestFailureAt && (
                <span className="block mt-0.5 text-foreground/80 font-medium">
                  Earliest failure: {timeAgo(earliestFailureAt)} ({formatDateTime(earliestFailureAt)})
                </span>
              )}
            </p>
          </div>
        </div>

        <Button
          onClick={onTriggerRecovery}
          size="sm"
          className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>Recover Bookings Now</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
