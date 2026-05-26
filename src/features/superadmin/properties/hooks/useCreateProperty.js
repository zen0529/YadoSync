import { useState } from "react";
import { createProperty } from "../supabase/createProperty";

export const useCreateProperty = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = async (propertyData, userId) => {
    setIsCreating(true);
    setError(null);
    try {
      const data = await createProperty(propertyData, userId);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { create, isCreating, error };
};
