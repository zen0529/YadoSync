/**
 * src/features/superadmin/logs/components/RecoverBookingsModal.jsx
 *
 * Modal dialog for triggering the `recoverMissingBookings` Edge Function.
 * Automatically resolves starting from the oldest failure timestamp in revision_failures.
 */

import { useState } from "react";
import { RefreshCw, Play, CheckSquare, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "../utils/formatters";
import { useRecoverBookings } from "../hooks/useRecoverBookings";

export function RecoverBookingsModal({ open, onOpenChange, earliestFailureAt, expiredCount }) {
  const [dryRun, setDryRun] = useState(false);

  const { recoverBookings, isRecovering } = useRecoverBookings({
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleStartRecovery = () => {
    recoverBookings({ dryRun });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isRecovering && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[460px] bg-card border-border shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="rounded-lg bg-green-500/15 p-2 text-green-600 dark:text-green-400">
              <RefreshCw className={`h-5 w-5 ${isRecovering ? "animate-spin" : ""}`} />
            </div>
            <DialogTitle className="text-base font-semibold">Recover Missing Bookings</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            This action queries Channex&apos;s permanent bookings archive and pulls any reservations
            that failed or dropped out of the 30-minute real-time feed window.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          {/* Automatic Starting Window Summary */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-foreground font-medium">
              <span className="text-muted-foreground">Recovery Starting Point:</span>
              <span className="text-green-600 dark:text-green-400 font-bold">
                {earliestFailureAt ? formatDateTime(earliestFailureAt) : "Earliest failure"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {expiredCount > 0
                ? `Found ${expiredCount} expired failure(s). The system will automatically recover all bookings starting from the oldest failure timestamp to ensure zero missing bookings.`
                : "No active expired failures detected. A 30-minute lookback will be used."}
            </p>
          </div>

          {/* Dry Run Checkbox */}
          <div
            onClick={() => !isRecovering && setDryRun((prev) => !prev)}
            className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div className="mt-0.5 text-green-600 dark:text-green-400">
              {dryRun ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="space-y-0.5 select-none">
              <div className="font-semibold text-foreground">Dry Run (Preview Mode)</div>
              <div className="text-[11px] text-muted-foreground">
                Simulates recovery and logs which bookings are missing without writing to the database.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isRecovering}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleStartRecovery}
            disabled={isRecovering}
            className="text-xs font-semibold flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20 transition-all cursor-pointer"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Recovering...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>{dryRun ? "Run Preview" : "Start Recovery"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
