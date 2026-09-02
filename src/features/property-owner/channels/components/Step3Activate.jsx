import { useState } from "react";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, ArrowLeft, CheckCheck, Plug } from "lucide-react";
import { createChannelConnection } from "../supabase";

// ── Step 3 — Review + Activate ────────────────────────────────────────────────
const Step3Activate = ({
  platform,
  hotelId,
  groupId,
  ratePlanMappings,
  property,
  ratePlans,
  onSuccess,
  onBack,
  onClose,
}) => {
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);

  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    try {
      await createChannelConnection({
        propertyId:         property.id,
        channexPropertyId:  property.channex_property_id,
        platform:           platform.id,
        hotelId,
        groupId,
        ratePlanMappings,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-white/5 border border-white/10 p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">Platform</span>
          <span className="text-xs font-medium text-foreground/80">{platform.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">Hotel ID</span>
          <span className="text-xs font-mono text-foreground/80">{hotelId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">Mapped rate plans</span>
          <span className="text-xs font-medium text-green-500">{ratePlanMappings.length} mapping{ratePlanMappings.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Mapping summary */}
      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
        {ratePlanMappings.map((m, i) => {
          const rp = ratePlans.find((r) => r.id === m.rate_plan_id);
          return (
            <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <CheckCheck className="w-3 h-3 text-green-500 shrink-0" />
              <span className="truncate">
                OTA room <span className="font-mono text-foreground/60">{m.room_type_code}</span>
                {" / rate "}
                <span className="font-mono text-foreground/60">{m.rate_plan_code}</span>
                {" → "}
                {rp ? `${rp.room_types?.title ? rp.room_types.title + " › " : ""}${rp.title}` : m.rate_plan_id}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-500">
          <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          disabled={activating}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors disabled:opacity-40"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <Button
          onClick={handleActivate}
          disabled={activating}
          className="h-8 text-xs bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20"
        >
          {activating ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Activating…</>
          ) : (
            <><Plug className="w-3.5 h-3.5 mr-1.5" /> Connect &amp; Activate</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step3Activate;
