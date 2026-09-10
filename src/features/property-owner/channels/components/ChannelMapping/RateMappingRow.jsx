import { ArrowRight } from "lucide-react";

export const RateMappingRow = ({
  rate,
  roomCode,
  isRoomMapped,
  currentLocalPlanId = "",
  availableRatePlans = [],
  selectableRatePlans = [],
  onRateSelect,
}) => {
  const key = `${roomCode}_${rate.rate_code}`;

  return (
    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
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
          onChange={(e) => onRateSelect && onRateSelect(key, e.target.value)}
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
            (selectableRatePlans.length === 0 ? (
              <option disabled>
                {availableRatePlans.length === 0
                  ? "No rate plans found for this room type"
                  : "All rate plans already mapped"}
              </option>
            ) : (
              selectableRatePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))
            ))}
        </select>
      </div>
    </div>
  );
};

export default RateMappingRow;
