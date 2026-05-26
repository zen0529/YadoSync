import { useState } from "react";
import { updateProperty } from "../supabase/updateProperty";

export const useUpdateProperty = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const update = async (id, propertyData) => {
    setIsUpdating(true);
    setError(null);
    try {
      const data = await updateProperty(id, propertyData);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return { update, isUpdating, error };
};
