import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getRoomTypes as fetchFromChannex } from "../channex/getRoomTypes";
import { createRoomType as createInChannex } from "../channex/createRoomType";
import { updateRoomType as updateInChannex } from "../channex/updateRoomType";
import { deleteRoomType as deleteFromChannex } from "../channex/deleteRoomType";
import { getRoomTypesByProperty } from "../supabase/getRoomTypes";
import { insertRoomType } from "../supabase/createRoomType";
import { updateRoomTypeInDB } from "../supabase/updateRoomType";
import { deleteRoomTypeFromDB } from "../supabase/deleteRoomType";
import { uploadPhotos } from "@/utils/uploadPhotos";

/**
 * useRoomTypes — manages room type state for a given property.
 *
 * Loads room types from Supabase (source of truth for the UI).
 * All mutations go to Channex first, then mirror to Supabase.
 *
 * @param {string|null} propertyId          - Local Supabase property UUID
 * @param {string|null} channexPropertyId   - Channex property UUID
 */
export const useRoomTypes = (propertyId, channexPropertyId) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ── Load ──────────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const rows = await getRoomTypesByProperty(propertyId);
      setRoomTypes(rows);
    } catch (err) {
      toast.error("Failed to load room types", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Create ────────────────────────────────────────────────────────────── */
  const createRoomType = async (form) => {
    if (!channexPropertyId) throw new Error("No Channex property ID available.");

    let processedForm = { ...form };
    if (form.content?.photos?.length > 0) {
      const uploadedPhotos = await uploadPhotos(form.content.photos);
      processedForm.content.photos = uploadedPhotos;
    }

    // 1. Create in Channex
    const channexResult = await createInChannex(channexPropertyId, processedForm);
    const channexId = channexResult?.data?.id;
    if (!channexId) throw new Error("Channex did not return a room type ID.");

    try {
      // 2. Save to Supabase
      const row = await insertRoomType(propertyId, channexId, processedForm);

      // 3. Update local state
      setRoomTypes(prev => [...prev, row]);
      return row;
    } catch (error) {
      // ROLLBACK: If Supabase insert fails, delete the orphaned record from Channex
      try {
        await deleteFromChannex(channexId);
        console.warn(`Rolled back room type ${channexId} in Channex due to Supabase error.`);
      } catch (rollbackError) {
        console.error("Failed to rollback Channex room type:", rollbackError);
      }
      throw error; // Re-throw the original Supabase error to the UI
    }
  };

  /* ── Update ────────────────────────────────────────────────────────────── */
  const updateRoomType = async (localId, channexId, form) => {
    let processedForm = { ...form };
    if (form.content?.photos?.length > 0) {
      const uploadedPhotos = await uploadPhotos(form.content.photos);
      processedForm.content.photos = uploadedPhotos;
    }

    // 1. Update in Channex
    await updateInChannex(channexId, processedForm);

    // 2. Update in Supabase
    const row = await updateRoomTypeInDB(localId, propertyId, processedForm);

    // 3. Update local state
    setRoomTypes(prev => prev.map(rt => rt.id === localId ? row : rt));
    return row;
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const deleteRoomType = async (localId, channexId) => {
    // We need to keep a copy of the room type in case we need to roll back
    const rtToRestore = roomTypes.find(rt => rt.id === localId);

    // 1. Delete from Channex
    await deleteFromChannex(channexId);

    try {
      // 2. Delete from Supabase
      await deleteRoomTypeFromDB(localId);
    } catch (error) {
      // ROLLBACK: If Supabase delete fails, recreate in Channex so it's not orphaned
      if (rtToRestore && channexPropertyId) {
        try {
          const form = {
             title: rtToRestore.title,
             count_of_rooms: rtToRestore.count_of_rooms,
             occ_adults: rtToRestore.occ_adults,
             occ_children: rtToRestore.occ_children,
             occ_infants: rtToRestore.occ_infants,
             default_occupancy: rtToRestore.default_occupancy,
             capacity: rtToRestore.capacity,
             room_kind: rtToRestore.room_kind,
             description: rtToRestore.content_description
          };
          const channexResult = await createInChannex(channexPropertyId, form);
          const newChannexId = channexResult?.data?.id;

          if (newChannexId) {
             // Update Supabase with the new Channex ID so it stays linked
             await updateRoomTypeInDB(localId, propertyId, { ...form, channex_room_type_id: newChannexId });
             // Update local state with new ID
             setRoomTypes(prev => prev.map(rt => rt.id === localId ? { ...rt, channex_room_type_id: newChannexId } : rt));
             console.warn(`Rolled back room type deletion. New Channex ID: ${newChannexId}`);
          }
        } catch (rollbackError) {
          console.error("Failed to rollback Channex room type deletion:", rollbackError);
        }
      }
      throw error; // Re-throw the original error to the UI
    }

    // 3. Update local state
    setRoomTypes(prev => prev.filter(rt => rt.id !== localId));
  };

  return {
    roomTypes,
    loading,
    refetch: load,
    createRoomType,
    updateRoomType,
    deleteRoomType,
  };
};
