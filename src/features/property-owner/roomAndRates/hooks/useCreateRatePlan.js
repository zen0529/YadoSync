import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const createRatePlanFunction = async ({
  propertyId,
  roomTypeId,
  channexPropertyId,
  channexRoomTypeId,
  form,
}) => {
  const { data, error: functionError } = await supabase.functions.invoke(
    "createRatePlan",
    {
      body: {
        propertyId,
        roomTypeId,
        channexPropertyId,
        channexRoomTypeId,
        form,
      },
    },
  );

  if (functionError) {
    console.error("[createRatePlan]", functionError);
    throw new Error("Something went wrong. Please try again.");
  }
  if (data?.error) {
    console.error("[createRatePlan]", data.error);
    throw new Error("Something went wrong. Please try again.");
  }

  return data.row;
};

export const useCreateRatePlan = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createRatePlan,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: createRatePlanFunction,
    onSuccess: (_, variables) => {
      // Invalidate the rate plans list — triggers an automatic re-fetch
      // so the new rate plan appears in the UI immediately.
      queryClient.invalidateQueries({
        queryKey: ["ratePlans", variables.propertyId],
      });
    },
  });

  return { createRatePlan, loading, error };
};
