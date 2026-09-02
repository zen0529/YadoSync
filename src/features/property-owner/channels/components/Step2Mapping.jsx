import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { getChannelMappingDetails } from "../supabase";

// ── Step 2 — Map OTA rooms/rates to local rate plans ─────────────────────────
const Step2Mapping = ({ platform, hotelId, ratePlans, onNext, onBack, onClose }) => {
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [otaRooms, setOtaRooms] = useState([]);
  const [groupId, setGroupId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  // mappings: { `${roomCode}_${rateCode}`: ratePlanId (local Supabase UUID) }
  const [mappings, setMappings] = useState({});

  // Fetch OTA room/rate structure once on mount
  useEffect(() => {
    let cancelled = false;
    const fetchDetails = async () => {
      setLoadingDetails(true);
      setLoadError(null);
      try {
        const { rooms, group_id } = await getChannelMappingDetails({ platform: platform.id, hotelId });
        if (!cancelled) {
          setOtaRooms(rooms ?? []);
          setGroupId(group_id);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    };
    fetchDetails();
    return () => { cancelled = true; };
  }, [platform.id, hotelId]);

  // Collect all OTA room+rate pairs
  const pairs = otaRooms.flatMap((room) =>
    (room.rates ?? []).map((rate) => ({
      roomCode: room.room_code,
      roomName: room.room_name,
      rateCode: rate.rate_code,
      rateName: rate.rate_name,
      pricing:  rate.pricing,
      maxPersons: rate.max_persons,
      key: `${room.room_code}_${rate.rate_code}`,
    }))
  );

  const setMapping = (key, ratePlanId) =>
    setMappings((prev) => ({ ...prev, [key]: ratePlanId }));

  const mappedCount = Object.values(mappings).filter(Boolean).length;

  const handleNext = () => {
    // Build ratePlanMappings array for createChannel
    const ratePlanMappings = pairs
      .filter((p) => mappings[p.key])
      .map((p) => {
        const rp = ratePlans.find((r) => r.id === mappings[p.key]);
        return {
          rate_plan_id:        rp?.id,
          channex_rate_plan_id: rp?.channex_rate_plan_id,
          room_type_code:      Number(p.roomCode),    // integer
          rate_plan_code:      Number(p.rateCode),    // integer
          pricing_type:        p.pricing,
          occupancy:           p.maxPersons,
        };
      });
    onNext({ groupId, ratePlanMappings });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground/70">
        Map each {platform.name} room/rate to one of your YadoSync rate plans.
        Unmapped rows will not be synced.
      </p>

      {loadingDetails ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          <span className="ml-2 text-xs text-muted-foreground/50">Loading OTA room details…</span>
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-2 text-xs text-red-500 py-4">
          <XCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{loadError}</span>
        </div>
      ) : pairs.length === 0 ? (
        <div className="text-xs text-muted-foreground/60 py-4">
          No rooms/rates returned for this hotel ID. Verify the ID and try again.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {pairs.map((pair) => (
            <div
              key={pair.key}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10"
            >
              {/* OTA room + rate */}
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground/80 truncate">{pair.roomName}</p>
                <p className="text-[11px] text-muted-foreground/50 truncate">
                  {pair.rateName}
                  {pair.pricing ? ` · ${pair.pricing}` : ""}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              {/* Local rate plan select */}
              <select
                value={mappings[pair.key] ?? ""}
                onChange={(e) => setMapping(pair.key, e.target.value || null)}
                className="w-full h-8 px-2 rounded-md border border-white/20 bg-white/10 dark:bg-white/5 text-xs text-foreground/80 outline-none focus:border-green-400/50 transition-all"
              >
                <option value="">— skip —</option>
                {ratePlans.map((rp) => (
                  <option key={rp.id} value={rp.id}>
                    {rp.room_types?.title ? `${rp.room_types.title} › ` : ""}{rp.title}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground/40">
            {mappedCount} / {pairs.length} mapped
          </span>
          <Button
            size="sm"
            disabled={loadingDetails || !!loadError || mappedCount === 0}
            onClick={handleNext}
            className="h-8 text-xs bg-green-500/90 hover:bg-green-600 text-white"
          >
            Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step2Mapping;
