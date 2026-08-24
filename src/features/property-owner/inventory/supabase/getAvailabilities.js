import { supabase } from "@/lib/supabase";

/**
 * Fetch availability rows for given room type IDs within date range [from, to]
 * @param {Object} params
 * @param {string[]} params.roomTypeIds
 * @param {string} params.from YYYY-MM-DD
 * @param {string} params.to YYYY-MM-DD
 * @returns {Promise<Record<string, Record<string, number>>>} Map of { [roomTypeId]: { [YYYY-MM-DD]: number } }
 */
export const getAvailabilities = async ({ roomTypeIds, from, to }) => {
  if (!roomTypeIds || !roomTypeIds.length) return {};

  const { data, error } = await supabase
    .from("availability")
    .select("room_type_id, date, available")
    .in("room_type_id", roomTypeIds)
    .gte("date", from)
    .lte("date", to)
    .order("date");

  if (error) throw error;

  const map = {};
  for (const row of data ?? []) {
    if (!map[row.room_type_id]) map[row.room_type_id] = {};
    map[row.room_type_id][row.date] = row.available;
  }
  return map;
};
