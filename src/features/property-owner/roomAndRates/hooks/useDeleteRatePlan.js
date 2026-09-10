import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const deleteRatePlanFunction = async ({ localId, channexRatePlanId }) => {
  const { data, error: functionError } = await supabase.functions.invoke("deleteRatePlan", {
    body: { localId, channexRatePlanId },
  });

  if (functionError) {
    console.error("[useDeleteRatePlan] function error:", functionError);
    throw new Error("Something went wrong while deleting the rate plan. Please try again.");
  }
  if (data?.error) {
    console.error("[useDeleteRatePlan] edge function error:", data.error);
    throw new Error("Something went wrong while deleting the rate plan. Please try again.");
  }

  return true;
};

export const useDeleteRatePlan = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteRatePlan,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: deleteRatePlanFunction,
    onSuccess: (_, variables) => {
      // Invalidate the rate plans list — triggers an automatic re-fetch
      // so the deleted rate plan is removed from the UI immediately.
      queryClient.invalidateQueries({
        queryKey: ["ratePlans", variables.propertyId],
      });
    },
  });

  return { deleteRatePlan, loading, error };
};
