import { supabase } from "@/lib/supabase";

export const updateProperty = async (id, propertyData) => {
  const { data, error } = await supabase
    .from("properties")
    .update(propertyData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
