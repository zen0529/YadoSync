import { supabase } from "@/lib/supabase";

/**
 * Fetch restriction rows for given property / room types / rate plans within date range [from, to]
 * @param {Object} params
 * @param {string} [params.propertyId] - Local Supabase property UUID
 * @param {string[]} [params.roomTypeIds] - Array of room type UUIDs
 * @param {string[]} [params.ratePlanIds] - Array of rate plan UUIDs
 * @param {string} params.from - YYYY-MM-DD
 * @param {string} params.to - YYYY-MM-DD
 * @returns {Promise<{roomTypeMap: Object, ratePlanMap: Object}>} Map indexed by room_type_id and rate_plan_id
 */
export const getRestrictions = async ({
  propertyId,
  roomTypeIds = [],
  ratePlanIds = [],
  from,
  to,
}) => {
  try {
    // 1. Get rate plans to map rate_plan_id -> room_type_id
    const planMap = {};
    const targetRatePlanIds = [...ratePlanIds];

    let planQuery = supabase.from("rate_plans").select("id, room_type_id");
    if (propertyId) {
      planQuery = planQuery.eq("property_id", propertyId);
    } else if (roomTypeIds.length) {
      planQuery = planQuery.in("room_type_id", roomTypeIds);
    }

    const { data: plans, error: planError } = await planQuery;
    if (!planError && plans) {
      for (const p of plans) {
        planMap[p.id] = p.room_type_id;
        if (!targetRatePlanIds.includes(p.id)) {
          targetRatePlanIds.push(p.id);
        }
      }
    }

    // 2. Query restrictions table
    let restrQuery = supabase
      .from("restrictions")
      .select(
        "rate_plan_id, date, rate, min_stay_arrival, min_stay_through, max_stay, stop_sell, closed_to_arrival, closed_to_departure",
      )
      .gte("date", from)
      .lte("date", to)
      .order("date");

    if (propertyId) {
      restrQuery = restrQuery.eq("property_id", propertyId);
    } else if (targetRatePlanIds.length) {
      restrQuery = restrQuery.in("rate_plan_id", targetRatePlanIds);
    } else {
      return { roomTypeMap: {}, ratePlanMap: {} };
    }

    const { data, error } = await restrQuery;
    if (error) {
      console.warn("Restrictions fetch notice:", error.message);
      return { roomTypeMap: {}, ratePlanMap: {} };
    }

    const roomTypeMap = {};
    const ratePlanMap = {};

    for (const row of data ?? []) {
      const restrictionData = {
        rate: row.rate,
        min_stay_arrival: row.min_stay_arrival,
        min_stay_through: row.min_stay_through,
        max_stay: row.max_stay,
        stop_sell: row.stop_sell,
        closed_to_arrival: row.closed_to_arrival,
        closed_to_departure: row.closed_to_departure,
      };

      // Populate ratePlanMap
      if (!ratePlanMap[row.rate_plan_id]) ratePlanMap[row.rate_plan_id] = {};
      ratePlanMap[row.rate_plan_id][row.date] = restrictionData;

      // Populate roomTypeMap
      const roomTypeId = planMap[row.rate_plan_id];
      if (roomTypeId) {
        if (!roomTypeMap[roomTypeId]) roomTypeMap[roomTypeId] = {};
        roomTypeMap[roomTypeId][row.date] = restrictionData;
      }
    }

    return { roomTypeMap, ratePlanMap };
  } catch (err) {
    console.warn("Error fetching restrictions:", err);
    return { roomTypeMap: {}, ratePlanMap: {} };
  }
};
