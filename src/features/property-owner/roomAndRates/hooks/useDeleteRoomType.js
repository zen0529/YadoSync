import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useDeleteRoomType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteRoomType = async (localId, channexRoomTypeId, propertyId, restoringData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke("deleteRoomType", {
        body: { localId, channexRoomTypeId, propertyId, restoringData },
      });

      if (functionError) throw new Error(`Function Error: ${functionError.message}`);
      if (data?.error) {
        // Return the newChannexId if the rollback occurred
        if (data.newChannexId) {
          throw new Error(data.error, { cause: { newChannexId: data.newChannexId } });
        }
        throw new Error(data.error);
      }

      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteRoomType, loading, error };
};
