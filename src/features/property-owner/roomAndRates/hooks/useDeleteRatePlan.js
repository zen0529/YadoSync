import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const deleteRatePlanFunction = async ({ localId, channexRatePlanId }) => {
  const { data, error: functionError } = await supabase.functions.invoke("deleteRatePlan", {
    body: { localId, channexRatePlanId },
  });

  if (functionError) throw new Error(`Function Error: ${functionError.message}`);
  if (data?.error) throw new Error(data.error);

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
