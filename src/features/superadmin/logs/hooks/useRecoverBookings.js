/**
 * src/features/superadmin/logs/hooks/useRecoverBookings.js
 *
 * TanStack Query mutation hook for executing the recoverMissingBookings action.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { triggerRecoverMissingBookings } from "../supabase/recoveryApi";
import { logsKeys } from "../tanstack/queryKeys";

export function useRecoverBookings({ onSuccess } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: triggerRecoverMissingBookings,
    onSuccess: (data) => {
      // Invalidate all logs and failure caches immediately
      queryClient.invalidateQueries({ queryKey: logsKeys.all });

      if (data?.dry_run) {
        toast.info(
          `Dry Run Complete: ${data.recovered ?? 0} missing booking(s) detected. No changes written.`,
          { duration: 5000 },
        );
      } else if (data?.recovered > 0) {
        toast.success(
          `Recovery Succeeded: ${data.recovered} missing booking(s) recovered and saved!`,
          { duration: 6000 },
        );
      } else {
        toast.info(
          data?.message || "No missing bookings found needing recovery.",
          { duration: 4000 },
        );
      }

      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (err) => {
      console.error("[useRecoverBookings] Recovery error:", err);
      toast.error(err.message || "Failed to recover missing bookings. Please try again.");
    },
  });

  return {
    recoverBookings: mutation.mutate,
    isRecovering: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}
