import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const updateRatePlanFunction = async ({ localId, channexRatePlanId, form }) => {
  const { data, error: functionError } = await supabase.functions.invoke("updateRatePlan", {
    body: { localId, channexRatePlanId, form },
  });

  if (functionError) throw new Error(`Function Error: ${functionError.message}`);
  if (data?.error) throw new Error(data.error);

  return data.row;
};

export const useUpdateRatePlan = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateRatePlan,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: updateRatePlanFunction,
    onSuccess: (_, variables) => {
      // Invalidate the rate plans list — triggers an automatic re-fetch
      // so the updated rate plan reflects in the UI immediately.
      queryClient.invalidateQueries({
        queryKey: ["ratePlans", variables.propertyId],
      });
    },
  });

  return { updateRatePlan, loading, error };
};
