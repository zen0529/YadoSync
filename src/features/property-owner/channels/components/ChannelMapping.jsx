import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChannelMappingDetails, createChannelConnection } from "../supabase";
import { useRatePlansForMapping } from "../hooks/useConnections";

// ── Channel Mapping Component ─────────────────────────────────────────────────
const ChannelMapping = ({
  platform,
  property,
  hotelId,
  connection,
  onNavigateToGeneral,
  onSave,
  onSuccess,
}) => {
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

  // Fetch local YadoSync room types and rate plans for this property
  const {
    roomTypes,
    ratePlans,
    loading: loadingLocalInventory,
  } = useRatePlansForMapping(property?.id);

  // Fetch OTA mapping details from Channex live
  const fetchMapping = async () => {
    if (!effectiveHotelId || !platform?.id) return;
    setLoadingDetails(true);
    setLoadError(null);
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
        const initialRooms = {};
        const initialRates = {};

        connection.mapping_payload.forEach((m) => {
          if (m.room_type_code && m.room_type_id) {
            initialRooms[m.room_type_code] = m.room_type_id;
          }
          if (m.room_type_code && m.rate_plan_code && m.rate_plan_id) {
            initialRates[`${m.room_type_code}_${m.rate_plan_code}`] =
              m.rate_plan_id;
          }
        });

        // Infer room type from mapped rate plan if room_type_id wasn't explicitly in payload
        if (ratePlans && ratePlans.length > 0) {
          connection.mapping_payload.forEach((m) => {
            if (!initialRooms[m.room_type_code] && m.rate_plan_id) {
              const matchedPlan = ratePlans.find(
                (rp) => rp.id === m.rate_plan_id,
              );
              const rId =
                matchedPlan?.room_type_id || matchedPlan?.room_types?.id;
              if (rId) initialRooms[m.room_type_code] = rId;
            }
          });
        }

        setRoomMappings(initialRooms);
        setRateMappings(initialRates);
      }
    } catch (err) {
      console.error("[ChannelMapping] Fetch failed:", err);
      setLoadError(
        err.message || "Failed to load mapping details from Channex.",
      );
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
          if (!updated[m.room_type_code] && m.rate_plan_id) {
            const matchedPlan = ratePlans.find(
              (rp) => rp.id === m.rate_plan_id,
            );
            const rId =
              matchedPlan?.room_type_id || matchedPlan?.room_types?.id;
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
    return otaRooms.flatMap((room) =>
      (room.rates ?? []).map((rate) => ({
        roomCode: room.room_code,
        roomName: room.room_name,
        rateCode: rate.rate_code,
        rateName: rate.rate_name,
        pricing: rate.pricing,
        maxPersons: rate.max_persons,
        readonly: Boolean(rate.readonly),
        key: `${room.room_code}_${rate.rate_code}`,
      })),
    );
  }, [otaRooms]);

  // Counters
  const mappedRoomsCount = useMemo(() => {
    return Object.values(roomMappings).filter(Boolean).length;
  }, [roomMappings]);

  const mappedRatesCount = useMemo(() => {
    return Object.values(rateMappings).filter(Boolean).length;
  }, [rateMappings]);

  // Handle Room Type Selection for an OTA Room
  const handleRoomTypeSelect = (roomCode, newRoomTypeId) => {
    setRoomMappings((prev) => ({
      ...prev,
      [roomCode]: newRoomTypeId || null,
    }));

    // If changing or clearing room type, remove any rate mappings under this room
    // that no longer belong to the newly selected room type
    setRateMappings((prev) => {
      const updated = { ...prev };
      const room = otaRooms.find((r) => r.room_code === roomCode);
      (room?.rates ?? []).forEach((rate) => {
        const key = `${roomCode}_${rate.rate_code}`;
        const currentPlanId = updated[key];
        if (currentPlanId) {
          const plan = ratePlans.find((rp) => rp.id === currentPlanId);
          const planRoomTypeId = plan?.room_type_id || plan?.room_types?.id;
          if (!newRoomTypeId || planRoomTypeId !== newRoomTypeId) {
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
      const ratePlanPayload = allOtaRates
        .filter((r) => rateMappings[r.key] && roomMappings[r.roomCode])
        .map((r) => {
          const localPlan = ratePlans.find(
            (rp) => rp.id === rateMappings[r.key],
          );
          return {
            room_type_code: Number(r.roomCode),
            room_type_id: roomMappings[r.roomCode],
            rate_plan_code: Number(r.rateCode),
            pricing_type: r.pricing || pricingType || "Standard",
            occupancy: Number(r.maxPersons) || 1,
            rate_plan_id: localPlan?.id,
            channex_rate_plan_id: localPlan?.channex_rate_plan_id,
            readonly: Boolean(r.readonly ?? false),
            primary_occ: true,
          };
        });

      const roomPayload = Object.entries(roomMappings)
        .filter(([_, rtId]) => Boolean(rtId))
        .map(([code, rtId]) => ({
          room_type_code: Number(code),
          room_type_id: rtId,
        }));

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
      console.error("[ChannelMapping] Save failed:", err);
      setSaveError(
        err.message || "Failed to save mapping and activate channel.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── 1. Empty State: No Hotel ID configured ──────────────────────────────────
  if (!effectiveHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground/60">
          <SlidersHorizontal className="w-6 h-6" />
        </div>
        <div className="max-w-xs">
          <h3 className="text-sm font-semibold text-foreground">
            Hotel ID Required
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Please configure and test your {platform?.name || "OTA"} Hotel ID in
            the General Settings tab before mapping rooms and rates.
          </p>
        </div>
        {onNavigateToGeneral && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNavigateToGeneral}
            className="mt-2 text-xs"
          >
            Go to General Settings
          </Button>
        )}
      </div>
    );
  }

  // ── 2. Loading State: Live Spinner ──────────────────────────────────────────
  if (loadingDetails || loadingLocalInventory) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-green-500" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Loading {platform?.name || "OTA"} inventory…
          </p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            Fetching rooms and rate plans from Channex for Hotel ID:{" "}
            <span className="font-semibold text-foreground/70">
              {effectiveHotelId}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ── 3. Error State ──────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-sm font-semibold text-foreground">
            Failed to Load Inventory
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-1">{loadError}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchMapping}
          className="text-xs gap-1.5 mt-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  // ── 4. Main Mapping View ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Overview header */}
      <div className="mb-4 pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Room &amp; Rate Mapping
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Map each {platform?.name} room to a local Room Type first, then
              pair its rate plans.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable list of OTA rooms and rates */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {otaRooms.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground/60">
            No rooms found for this hotel on {platform?.name}.
          </div>
        ) : (
          otaRooms.map((room) => {
            const selectedRoomTypeId = roomMappings[room.room_code] || "";
            const isRoomMapped = Boolean(selectedRoomTypeId);

            // Filter local rate plans to ONLY those belonging to this selected room type
            const availableRatePlans = isRoomMapped
              ? ratePlans.filter(
                  (rp) =>
                    rp.room_type_id === selectedRoomTypeId ||
                    rp.room_types?.id === selectedRoomTypeId,
                )
              : [];

            return (
              <div
                key={room.room_code}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isRoomMapped
                    ? "border-green-500/30 dark:border-green-500/20 bg-black/[0.02] dark:bg-white/[0.02]"
                    : "border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]"
                }`}
              >
                {/* ── Room Header with Room Type Mapping Dropdown ── */}
                <div className="p-3.5 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {room.room_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/5 dark:bg-white/10 text-muted-foreground/60 shrink-0">
                      ID: {room.room_code}
                    </span>
                  </div>

                  {/* Room Type Selector */}
                  <div className="flex items-center gap-2 sm:w-[290px] shrink-0">
                    <span className="text-[11px] font-medium text-muted-foreground/70 shrink-0">
                      Room Type:
                    </span>
                    <select
                      value={selectedRoomTypeId}
                      onChange={(e) =>
                        handleRoomTypeSelect(room.room_code, e.target.value)
                      }
                      className={`w-full h-8 px-2.5 rounded-lg border text-xs outline-none transition-all ${
                        isRoomMapped
                          ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20 text-foreground font-medium"
                          : "border-black/15 dark:border-white/15 bg-white dark:bg-[#16171d] text-muted-foreground"
                      } focus:border-green-500 focus:ring-1 focus:ring-green-500/20`}
                    >
                      <option value="">— Select Local Room Type —</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── Rates Section under this Room ── */}
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {(room.rates ?? []).map((rate) => {
                    const key = `${room.room_code}_${rate.rate_code}`;
                    const currentLocalPlanId = rateMappings[key] || "";

                    return (
                      <div
                        key={rate.rate_code}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                      >
                        {/* Left: OTA rate info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-foreground truncate">
                              {rate.rate_name}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-muted-foreground/70">
                              Max {rate.max_persons} guest
                              {rate.max_persons > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground/45 mt-0.5">
                            Rate ID: {rate.rate_code} · {rate.pricing}
                          </p>
                        </div>

                        {/* Right: Local Rate Plan selector (disabled until room type is mapped) */}
                        <div className="flex items-center gap-2 sm:w-[290px] shrink-0">
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 hidden sm:block ${
                              isRoomMapped
                                ? "text-muted-foreground/40"
                                : "text-muted-foreground/20"
                            }`}
                          />

                          <select
                            disabled={!isRoomMapped}
                            value={currentLocalPlanId}
                            onChange={(e) =>
                              handleRateSelect(key, e.target.value)
                            }
                            className={`w-full h-8 px-2.5 rounded-lg border text-xs outline-none transition-all ${
                              !isRoomMapped
                                ? "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-muted-foreground/40 cursor-not-allowed"
                                : currentLocalPlanId
                                ? "border-green-500/40 bg-green-50/30 dark:bg-green-950/20 text-foreground font-medium"
                                : "border-black/15 dark:border-white/15 bg-white dark:bg-[#16171d] text-muted-foreground/70"
                            } focus:border-green-500 focus:ring-1 focus:ring-green-500/20`}
                          >
                            <option value="">
                              {!isRoomMapped
                                ? "— Map Room Type First —"
                                : "— Skip / Unmapped —"}
                            </option>
                            {isRoomMapped &&
                              (availableRatePlans.length === 0 ? (
                                <option disabled>
                                  No rate plans found for this room type
                                </option>
                              ) : (
                                availableRatePlans.map((plan) => (
                                  <option key={plan.id} value={plan.id}>
                                    {plan.title}
                                  </option>
                                ))
                              ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer action bar */}
      <div className="shrink-0 pt-4 mt-2 border-t border-black/5 dark:border-white/10 flex flex-col gap-2">
        {saveError && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{saveError}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground/60">
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connection activated &amp; mappings saved!
              </span>
            ) : (
              <span>
                Map room types and rate plans to sync availability and pricing
              </span>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={
              saving || mappedRoomsCount === 0 || mappedRatesCount === 0
            }
            className="h-9 px-4 text-xs bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-500/20 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Connecting &amp; Saving…
              </>
            ) : (
              `Save & Connect (${mappedRatesCount})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChannelMapping;
