import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePushAvailability } from "./usePushAvailability";
import { usePushRestrictions } from "./usePushRestrictions";

/**
 * useARI — Orchestration hook for the ARI editor
 *
 * Loads availability and restrictions from Supabase (local mirror),
 * and exposes save functions that push deltas to Channex via the
 * pushAvailability / pushRestrictions edge functions.
 *
 * @param {string|null} propertyId
 * @param {string|null} channexPropertyId
 */
export const useARI = (propertyId, channexPropertyId) => {
  const [availability, setAvailability] = useState({}); // { [roomTypeId]: { [date]: count } }
  const [restrictions, setRestrictions] = useState({}); // { [ratePlanId]: { [date]: { rate, ... } } }
  const [loading, setLoading]           = useState(false);
  const [syncing, setSyncing]           = useState(false);

  const { pushAvailability, loading: pushingAvail } = usePushAvailability();
  const { pushRestrictions, loading: pushingRestr } = usePushRestrictions();

  const saving = pushingAvail || pushingRestr || syncing;

  // ── Load from Supabase ──────────────────────────────────────────────────
  const load = useCallback(async (roomTypeIds = [], ratePlanIds = []) => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const maxDate = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

      const [availRes, restrRes] = await Promise.all([
        roomTypeIds.length > 0
          ? supabase
              .from("availability")
              .select("room_type_id, date, available")
              .in("room_type_id", roomTypeIds)
              .gte("date", today)
              .lte("date", maxDate)
              .order("date")
          : Promise.resolve({ data: [] }),

        ratePlanIds.length > 0
          ? supabase
              .from("restrictions")
              .select("rate_plan_id, date, rate, min_stay_arrival, stop_sell, closed_to_arrival, closed_to_departure")
              .in("rate_plan_id", ratePlanIds)
              .gte("date", today)
              .lte("date", maxDate)
              .order("date")
          : Promise.resolve({ data: [] }),
      ]);

      // Index by entity id + date
      const availMap = {};
      for (const row of availRes.data ?? []) {
        if (!availMap[row.room_type_id]) availMap[row.room_type_id] = {};
        availMap[row.room_type_id][row.date] = row.available;
      }

      const restrMap = {};
      for (const row of restrRes.data ?? []) {
        if (!restrMap[row.rate_plan_id]) restrMap[row.rate_plan_id] = {};
        restrMap[row.rate_plan_id][row.date] = {
          rate:                row.rate,
          min_stay_arrival:    row.min_stay_arrival,
          stop_sell:           row.stop_sell,
          closed_to_arrival:   row.closed_to_arrival,
          closed_to_departure: row.closed_to_departure,
        };
      }

      setAvailability(availMap);
      setRestrictions(restrMap);
    } catch (err) {
      toast.error("Failed to load ARI data", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  // ── Save availability for a date range ─────────────────────────────────
  /**
   * @param {object} params
   * @param {string} params.roomTypeId         - local Supabase UUID
   * @param {string} params.channexRoomTypeId  - Channex UUID
   * @param {string} params.dateFrom           - YYYY-MM-DD (inclusive)
   * @param {string} params.dateTo             - YYYY-MM-DD (inclusive)
   * @param {number} params.available          - room count
   */
  const saveAvailability = async ({
    roomTypeId,
    channexRoomTypeId,
    dateFrom,
    dateTo,
    available,
  }) => {
    if (!channexPropertyId) throw new Error("No Channex property ID.");

    // Expand the range into individual date entries
    const values = expandDateRange(dateFrom, dateTo).map((date) => ({ date, available }));

    await pushAvailability({
      propertyId,
      roomTypeId,
      channexPropertyId,
      channexRoomTypeId,
      values,
    });

    // Update local state so UI reflects the change immediately
    setAvailability((prev) => {
      const next = { ...prev, [roomTypeId]: { ...(prev[roomTypeId] ?? {}) } };
      for (const { date } of values) {
        next[roomTypeId][date] = available;
      }
      return next;
    });
  };

  // ── Save restrictions for a date range ─────────────────────────────────
  /**
   * @param {object} params
   * @param {string} params.ratePlanId          - local Supabase UUID
   * @param {string} params.channexRatePlanId   - Channex UUID
   * @param {"per_room"|"per_person"} params.sellMode
   * @param {string} params.dateFrom
   * @param {string} params.dateTo
   * @param {number} params.rateMajor           - price in MAJOR units (pesos) — converted to cents here
   * @param {number} params.minStayArrival
   * @param {boolean} params.stopSell
   * @param {boolean} params.closedToArrival
   * @param {boolean} params.closedToDeparture
   */
  const saveRestrictions = async ({
    ratePlanId,
    channexRatePlanId,
    sellMode = "per_room",
    dateFrom,
    dateTo,
    rateMajor,
    minStayArrival = 1,
    stopSell = false,
    closedToArrival = false,
    closedToDeparture = false,
  }) => {
    if (!channexPropertyId) throw new Error("No Channex property ID.");

    // Convert major → minor units (cents) at the API boundary
    const rateCents = Math.round(Number(rateMajor) * 100);

    const values = expandDateRange(dateFrom, dateTo).map((date) => ({
      date,
      rate:                rateCents,
      min_stay_arrival:    Number(minStayArrival) || 1,
      stop_sell:           Boolean(stopSell),
      closed_to_arrival:   Boolean(closedToArrival),
      closed_to_departure: Boolean(closedToDeparture),
    }));

    await pushRestrictions({
      propertyId,
      ratePlanId,
      channexPropertyId,
      channexRatePlanId,
      sellMode,
      values,
    });

    // Update local state
    setRestrictions((prev) => {
      const next = { ...prev, [ratePlanId]: { ...(prev[ratePlanId] ?? {}) } };
      for (const v of values) {
        next[ratePlanId][v.date] = {
          rate:                rateCents,
          min_stay_arrival:    Number(minStayArrival) || 1,
          stop_sell:           Boolean(stopSell),
          closed_to_arrival:   Boolean(closedToArrival),
          closed_to_departure: Boolean(closedToDeparture),
        };
      }
      return next;
    });
  };

  // ── Full sync ───────────────────────────────────────────────────────────
  const fullSync = async () => {
    if (!propertyId) return;
    setSyncing(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "fullSyncARI",
        { body: { source: "manual", propertyId } },
      );
      if (functionError) throw new Error(functionError.message);
      if (data?.error)   throw new Error(data.error);
      toast.success(
        `Sync complete — ${data.roomTypes} room type(s), ${data.ratePlans} rate plan(s)`,
        { description: data.errors?.length ? `${data.errors.length} error(s) — check logs` : undefined },
      );
      return data;
    } catch (err) {
      toast.error("Full sync failed", { description: err.message });
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  return {
    availability,
    restrictions,
    loading,
    saving,
    load,
    saveAvailability,
    saveRestrictions,
    fullSync,
  };
};

// ── Utility ────────────────────────────────────────────────────────────────

/**
 * Expand a YYYY-MM-DD date range (inclusive) into an array of date strings.
 */
function expandDateRange(dateFrom, dateTo) {
  const dates = [];
  const start = new Date(dateFrom + "T00:00:00Z");
  const end   = new Date(dateTo   + "T00:00:00Z");
  const cur   = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}
