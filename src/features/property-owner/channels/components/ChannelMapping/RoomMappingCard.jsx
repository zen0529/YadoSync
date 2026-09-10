import { TriangleAlert } from "lucide-react";
import RateMappingRow from "./RateMappingRow";
import { filterAvailableRatePlans } from "../../utils/mappingUtils";

export const RoomMappingCard = ({
  room,
  selectedRoomTypeId = "",
  availableRoomTypes = [],
  ratePlans = [],
  rateMappings = {},
  onRoomTypeSelect,
  onRateSelect,
}) => {
  const isRoomMapped = Boolean(selectedRoomTypeId);

  // Available rate plans for the selected room type
  const availableRatePlans = isRoomMapped
    ? ratePlans.filter((rp) => rp.room_type_id === selectedRoomTypeId)
    : [];

  // Warn when the mapped Channex room type has no rate plans at all
  const showNoSyncedRatePlansWarning =
    isRoomMapped && availableRatePlans.length === 0;

  return (
    <div
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
              onRoomTypeSelect && onRoomTypeSelect(room.room_code, e.target.value)
            }
            className={`w-full h-8 px-2.5 rounded-lg border text-xs outline-none transition-all ${
              isRoomMapped
                ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20 text-foreground font-medium"
                : "border-black/15 dark:border-white/15 bg-white dark:bg-[#16171d] text-muted-foreground"
            } focus:border-green-500 focus:ring-1 focus:ring-green-500/20`}
          >
            <option value="">— Select Local Room Type —</option>
            {availableRoomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── No rate plans warning ── */}
      {showNoSyncedRatePlansWarning && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500/8 border-b border-amber-500/20 text-amber-600 dark:text-amber-400">
          <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
          <p className="text-[11px]">
            No rate plans found in Channex for this room type. Create
            rate plans in <strong>Inventory → Rate Plans</strong> and
            ensure they are synced to Channex before mapping.
          </p>
        </div>
      )}

      {/* ── Rates Section under this Room ── */}
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {(room.rates ?? []).map((rate) => {
          const key = `${room.room_code}_${rate.rate_code}`;
          const currentLocalPlanId = rateMappings[key] || "";
          const { selectableRatePlans } = filterAvailableRatePlans(
            ratePlans,
            selectedRoomTypeId,
            rateMappings,
            key
          );

          return (
            <RateMappingRow
              key={rate.rate_code}
              rate={rate}
              roomCode={room.room_code}
              isRoomMapped={isRoomMapped}
              currentLocalPlanId={currentLocalPlanId}
              availableRatePlans={availableRatePlans}
              selectableRatePlans={selectableRatePlans}
              onRateSelect={onRateSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RoomMappingCard;
