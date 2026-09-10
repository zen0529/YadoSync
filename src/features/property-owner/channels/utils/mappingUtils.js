/**
 * Pure helper functions for Channel Mapping
 * Contains zero React state or API/Supabase dependencies.
 */

/**
 * Extracts and flattens all room + rate pairs from OTA rooms list.
 *
 * @param {Array} otaRooms
 * @returns {Array<{ roomCode: string|number, roomName: string, rateCode: string|number, rateName: string, pricing: string, maxPersons: number, readonly: boolean, key: string }>}
 */
export const extractAllOtaRates = (otaRooms = []) => {
  return (otaRooms || []).flatMap((room) =>
    (room.rates ?? []).map((rate) => ({
      roomCode: room.room_code,
      roomName: room.room_name,
      rateCode: rate.rate_code,
      rateName: rate.rate_name,
      pricing: rate.pricing,
      maxPersons: rate.max_persons,
      readonly: Boolean(rate.readonly),
      key: `${room.room_code}_${rate.rate_code}`,
    }))
  );
};

/**
 * Pre-populates initial room and rate mappings from an existing connection mapping payload.
 * Also infers room type from mapped rate plans if available.
 *
 * @param {Array} mappingPayload
 * @param {Array} ratePlans
 * @returns {{ initialRooms: Record<string, string>, initialRates: Record<string, string> }}
 */
export const resolveInitialMappings = (mappingPayload = [], ratePlans = []) => {
  const initialRooms = {};
  const initialRates = {};

  if (!Array.isArray(mappingPayload)) {
    return { initialRooms, initialRates };
  }

  mappingPayload.forEach((m) => {
    if (m.room_type_code && m.channex_room_type_id) {
      initialRooms[m.room_type_code] = m.channex_room_type_id;
    }
    if (m.room_type_code && m.rate_plan_code && m.channex_rate_plan_id) {
      initialRates[`${m.room_type_code}_${m.rate_plan_code}`] = m.channex_rate_plan_id;
    }
  });

  // Infer room type from mapped rate plan if not explicitly in payload
  if (ratePlans && ratePlans.length > 0) {
    mappingPayload.forEach((m) => {
      if (!initialRooms[m.room_type_code] && m.channex_rate_plan_id) {
        const matchedPlan = ratePlans.find((rp) => rp.id === m.channex_rate_plan_id);
        const rId = matchedPlan?.room_type_id;
        if (rId) initialRooms[m.room_type_code] = rId;
      }
    });
  }

  return { initialRooms, initialRates };
};

/**
 * Filters room types to exclude those already mapped to a different OTA room.
 *
 * @param {Array} roomTypes
 * @param {Record<string, string>} roomMappings
 * @param {string|number} currentRoomCode
 * @returns {Array}
 */
export const filterAvailableRoomTypes = (roomTypes = [], roomMappings = {}, currentRoomCode) => {
  return (roomTypes || []).filter((rt) => {
    const isMappedToOtherRoom = Object.entries(roomMappings).some(
      ([code, mappedRtId]) => code !== String(currentRoomCode) && mappedRtId === rt.id
    );
    return !isMappedToOtherRoom;
  });
};

/**
 * Filters rate plans for a mapped room type and excludes those mapped to other rates.
 *
 * @param {Array} ratePlans
 * @param {string} selectedRoomTypeId
 * @param {Record<string, string>} rateMappings
 * @param {string} currentKey
 * @returns {{ availableRatePlans: Array, selectableRatePlans: Array }}
 */
export const filterAvailableRatePlans = (
  ratePlans = [],
  selectedRoomTypeId,
  rateMappings = {},
  currentKey
) => {
  if (!selectedRoomTypeId) {
    return { availableRatePlans: [], selectableRatePlans: [] };
  }

  const availableRatePlans = ratePlans.filter(
    (rp) => rp.room_type_id === selectedRoomTypeId
  );

  const selectableRatePlans = availableRatePlans.filter((plan) => {
    const isMappedToOtherRate = Object.entries(rateMappings).some(
      ([k, mappedPlanId]) => k !== currentKey && mappedPlanId === plan.id
    );
    return !isMappedToOtherRate;
  });

  return { availableRatePlans, selectableRatePlans };
};

/**
 * Validates and constructs payloads for saving mapping to Channex / Supabase.
 *
 * @param {object} params
 * @param {Array} params.allOtaRates
 * @param {Record<string, string>} params.rateMappings
 * @param {Record<string, string>} params.roomMappings
 * @param {Array} params.ratePlans
 * @param {string} [params.pricingType]
 * @returns {{ ratePlanPayload: Array, roomPayload: Array }}
 */
export const buildMappingPayloads = ({
  allOtaRates = [],
  rateMappings = {},
  roomMappings = {},
  ratePlans = [],
  pricingType = "Standard",
}) => {
  const ratePlanPayload = allOtaRates
    .filter((r) => rateMappings[r.key] && roomMappings[r.roomCode])
    .map((r) => {
      const channexPlan = ratePlans.find((rp) => rp.id === rateMappings[r.key]);
      return {
        room_type_code: Number(r.roomCode),
        channex_room_type_id: roomMappings[r.roomCode],
        rate_plan_code: Number(r.rateCode),
        channex_rate_plan_id: channexPlan?.id,
        pricing_type: r.pricing || pricingType || "Standard",
        occupancy: Number(r.maxPersons) || 1,
        sell_mode: channexPlan?.sell_mode ?? "per_room",
        readonly: Boolean(r.readonly ?? false),
        primary_occ: true,
      };
    });

  const unresolved = ratePlanPayload.find((r) => !r.channex_rate_plan_id);
  if (unresolved) {
    throw new Error(
      "One or more selected rate plans could not be resolved. Please retry or re-open the mapping panel."
    );
  }

  const roomPayload = Object.entries(roomMappings)
    .filter(([_, rtId]) => Boolean(rtId))
    .map(([code, rtId]) => ({
      room_type_code: Number(code),
      room_type_id: rtId,
    }));

  return { ratePlanPayload, roomPayload };
};
