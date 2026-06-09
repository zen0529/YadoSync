import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createRatePlan as createInChannex } from "../channex/createRatePlan";
import { updateRatePlan as updateInChannex } from "../channex/updateRatePlan";
import { deleteRatePlan as deleteFromChannex } from "../channex/deleteRatePlan";
import { getRatePlansByProperty } from "../supabase/getRatePlans";
import { insertRatePlan } from "../supabase/createRatePlan";
import { updateRatePlanInDB } from "../supabase/updateRatePlan";
import { deleteRatePlanFromDB } from "../supabase/deleteRatePlan";

/**
 * useRatePlans — manages rate plan state for a given property.
 *
 * Loads rate plans from Supabase (source of truth for the UI).
 * All mutations go to Channex first, then mirror to Supabase.
 *
 * @param {string|null} propertyId          - Local Supabase property UUID
 * @param {string|null} channexPropertyId   - Channex property UUID
 */
export const useRatePlans = (propertyId, channexPropertyId) => {
  const [ratePlans, setRatePlans] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ── Load ──────────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const rows = await getRatePlansByProperty(propertyId);
      setRatePlans(rows);
    } catch (err) {
      toast.error("Failed to load rate plans", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Create ────────────────────────────────────────────────────────────── */
  /**
   * @param {object} form           - Rate plan form values
   * @param {string} roomTypeId     - Local Supabase room_type UUID
   * @param {string} channexRoomTypeId - Channex room type UUID
   */
  const createRatePlan = async (form, roomTypeId, channexRoomTypeId) => {
    if (!channexPropertyId) throw new Error("No Channex property ID available.");
    if (!channexRoomTypeId) throw new Error("No Channex room type ID available.");

    // 1. Create in Channex
    const channexResult = await createInChannex(channexPropertyId, channexRoomTypeId, form);
    const channexId = channexResult?.data?.id;
    if (!channexId) throw new Error("Channex did not return a rate plan ID.");

    try {
      // 2. Save to Supabase
      const row = await insertRatePlan(propertyId, roomTypeId, channexId, form);

      // 3. Update local state
      setRatePlans(prev => [...prev, row]);
      return row;
    } catch (error) {
      // ROLLBACK: If Supabase insert fails, delete the orphaned record from Channex
      try {
        await deleteFromChannex(channexId);
        console.warn(`Rolled back rate plan ${channexId} in Channex due to Supabase error.`);
      } catch (rollbackError) {
        console.error("Failed to rollback Channex rate plan:", rollbackError);
      }
      throw error; // Re-throw the original Supabase error to the UI
    }
  };

  /* ── Update ────────────────────────────────────────────────────────────── */
  const updateRatePlan = async (localId, channexRatePlanId, form) => {
    // 1. Update in Channex
    await updateInChannex(channexRatePlanId, form);

    // 2. Update in Supabase
    const row = await updateRatePlanInDB(localId, form);

    // 3. Update local state
    setRatePlans(prev => prev.map(rp => rp.id === localId ? row : rp));
    return row;
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const deleteRatePlan = async (localId, channexRatePlanId) => {
    // 1. Delete from Channex
    await deleteFromChannex(channexRatePlanId);

    // 2. Delete from Supabase
    await deleteRatePlanFromDB(localId);

    // 3. Update local state
    setRatePlans(prev => prev.filter(rp => rp.id !== localId));
  };

  return {
    ratePlans,
    loading,
    refetch: load,
    createRatePlan,
    updateRatePlan,
    deleteRatePlan,
  };
};
