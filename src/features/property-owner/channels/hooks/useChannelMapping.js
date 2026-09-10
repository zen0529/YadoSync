import { useState, useEffect, useMemo } from "react";
import { getChannelMappingDetails, createChannelConnection } from "../supabase";
import { useRatePlansForMapping } from "./useRatePlansForMapping";
import {
  extractAllOtaRates,
  resolveInitialMappings,
  buildMappingPayloads,
} from "../utils/mappingUtils";

/**
 * Custom hook managing the channel mapping workflow and state machine.
 * Acts as the bridge between UI components, TanStack Query, and Supabase edge functions.
 */
export const useChannelMapping = ({
  platform,
  property,
  hotelId,
  connection,
  onSave,
  onSuccess,
} = {}) => {
  const effectiveHotelId = hotelId || connection?.ota_hotel_id || "";

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [otaRooms, setOtaRooms] = useState([]);
  const [pricingType, setPricingType] = useState("Standard");
  const [currency, setCurrency] = useState(null);
  const [groupId, setGroupId] = useState(null);

  // roomMappings: { [roomCode]: localRoomTypeId }
  const [roomMappings, setRoomMappings] = useState({});
  // rateMappings: { [`${roomCode}_${rateCode}`]: localRatePlanId }
  const [rateMappings, setRateMappings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fetch Channex-side room types and rate plans for this property
  const {
    roomTypes,
    ratePlans,
    loading: loadingLocalInventory,
  } = useRatePlansForMapping({
    propertyId: property?.id,
    channexPropertyId: property?.channex_property_id,
  });

  // Fetch OTA mapping details from Channex live
  const fetchMapping = async () => {
    if (!effectiveHotelId || !platform?.id) return;
    setLoadingDetails(true);
    setLoadError(null);
    setRoomMappings({});
    setRateMappings({});

    try {
      const data = await getChannelMappingDetails({
        channel: platform.id,
        hotelId: effectiveHotelId,
      });

      setOtaRooms(data.rooms ?? []);
      setPricingType(data.pricing_type ?? "Standard");
      setCurrency(data.currency ?? null);
      setGroupId(data.group_id ?? null);

      // Pre-populate with existing mappings from connection if present
      if (
        connection?.mapping_payload &&
        Array.isArray(connection.mapping_payload)
      ) {
        const { initialRooms, initialRates } = resolveInitialMappings(
          connection.mapping_payload,
          ratePlans
        );
        setRoomMappings(initialRooms);
        setRateMappings(initialRates);
      }
    } catch (err) {
      console.error("[useChannelMapping] Fetch failed:", err);
      setLoadError("Failed to load channel mapping details. Please try again.");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (effectiveHotelId) {
      fetchMapping();
    }
  }, [effectiveHotelId, platform?.id]);

  // Pre-fill inferred room types once ratePlans are loaded if they weren't ready initially
  useEffect(() => {
    if (
      connection?.mapping_payload &&
      Array.isArray(connection.mapping_payload) &&
      ratePlans.length > 0
    ) {
      setRoomMappings((prev) => {
        let changed = false;
        const updated = { ...prev };
        connection.mapping_payload.forEach((m) => {
          if (!updated[m.room_type_code] && m.channex_rate_plan_id) {
            const matchedPlan = ratePlans.find(
              (rp) => rp.id === m.channex_rate_plan_id
            );
            const rId = matchedPlan?.room_type_id;
            if (rId) {
              updated[m.room_type_code] = rId;
              changed = true;
            }
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [ratePlans, connection?.mapping_payload]);

  // All OTA room+rate pairs
  const allOtaRates = useMemo(() => {
    return extractAllOtaRates(otaRooms);
  }, [otaRooms]);

  // Counters & validation
  const mappedRoomsCount = useMemo(() => {
    return Object.values(roomMappings).filter(Boolean).length;
  }, [roomMappings]);

  const mappedRatesCount = useMemo(() => {
    return Object.values(rateMappings).filter(Boolean).length;
  }, [rateMappings]);

  const allRatesMapped = useMemo(() => {
    return (
      allOtaRates.length > 0 &&
      allOtaRates.every((rate) => Boolean(rateMappings[rate.key]))
    );
  }, [allOtaRates, rateMappings]);

  // Handle Room Type Selection for an OTA Room
  const handleRoomTypeSelect = (roomCode, newRoomTypeId) => {
    setRoomMappings((prev) => ({
      ...prev,
      [roomCode]: newRoomTypeId || null,
    }));

    // If changing or clearing room type, remove rate mappings that no longer belong
    setRateMappings((prev) => {
      const updated = { ...prev };
      const room = otaRooms.find((r) => r.room_code === roomCode);
      (room?.rates ?? []).forEach((rate) => {
        const key = `${roomCode}_${rate.rate_code}`;
        const currentPlanId = updated[key];
        if (currentPlanId) {
          const plan = ratePlans.find((rp) => rp.id === currentPlanId);
          if (!newRoomTypeId || plan?.room_type_id !== newRoomTypeId) {
            delete updated[key];
          }
        }
      });
      return updated;
    });

    setSaveSuccess(false);
  };

  // Handle Rate Plan Selection for an OTA Rate
  const handleRateSelect = (key, ratePlanId) => {
    setRateMappings((prev) => ({
      ...prev,
      [key]: ratePlanId || null,
    }));
    setSaveSuccess(false);
  };

  // Save full mapping payload & connect/activate
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { ratePlanPayload, roomPayload } = buildMappingPayloads({
        allOtaRates,
        rateMappings,
        roomMappings,
        ratePlans,
        pricingType,
      });

      console.log("rate plan payload", ratePlanPayload);

      if (onSave) {
        await onSave({
          groupId,
          pricingType,
          currency,
          hotelId: effectiveHotelId,
          roomMappings: roomPayload,
          ratePlanMappings: ratePlanPayload,
        });
      } else {
        await createChannelConnection({
          propertyId: property?.id,
          channexPropertyId: property?.channex_property_id,
          channel: platform?.id,
          hotelId: effectiveHotelId,
          groupId,
          ratePlanMappings: ratePlanPayload,
        });
      }

      setSaveSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      // Keep the raw error in the console for developer debugging
      console.error("[useChannelMapping] Save failed:", err);
      setSaveError("Something went wrong while connecting your channel. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return {
    effectiveHotelId,
    loadingDetails,
    loadingLocalInventory,
    loadError,
    otaRooms,
    pricingType,
    currency,
    groupId,
    roomMappings,
    rateMappings,
    roomTypes,
    ratePlans,
    allOtaRates,
    mappedRoomsCount,
    mappedRatesCount,
    allRatesMapped,
    saving,
    saveSuccess,
    saveError,
    fetchMapping,
    handleRoomTypeSelect,
    handleRateSelect,
    handleSave,
  };
};
