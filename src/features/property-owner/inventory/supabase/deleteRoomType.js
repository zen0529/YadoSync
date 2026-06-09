import { supabase } from "@/lib/supabase";

export const deleteRoomTypeFromDB = async (id) => {
  const { error } = await supabase
    .from("room_types")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete room type: ${error.message}`);
};


