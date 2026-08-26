import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BedDouble, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushAvailability } from "@/features/property-owner/roomAndRates/hooks/usePushAvailability";
import { DOW_LABELS, MONTH_NAMES } from "../utils/dateUtils";

export const AvailabilityEditModal = ({
  open,
  onClose,
  roomType,
  date,
  currentValue,
  channexPropertyId,
  propertyId,
  onSaved,
}) => {
  const [val, setVal] = useState(currentValue ?? roomType?.count_of_rooms ?? 1);
  const [saving, setSaving] = useState(false);
  const { pushAvailability } = usePushAvailability();

  useEffect(() => {
    setVal(currentValue ?? roomType?.count_of_rooms ?? 1);
  }, [currentValue, roomType, open]);

  if (!open || !roomType || !date) return null;

  const d = new Date(date + "T00:00:00Z");
  const label = `${DOW_LABELS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!roomType.channex_room_type_id) {
      toast.error(
        "Room type has no Channex ID — sync it in Rooms & Rates first.",
      );
      return;
    }
    setSaving(true);
    try {
      await pushAvailability({
        propertyId,
        roomTypeId: roomType.id,
        channexPropertyId,
        channexRoomTypeId: roomType.channex_room_type_id,
        values: [{ date, available: Number(val) }],
      });
      toast.success("Availability updated", {
        description: `${val} rooms on ${date}`,
      });
      onSaved(roomType.id, date, Number(val));
      onClose();
    } catch (err) {
      toast.error("Failed to push availability", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-2xl bg-background/90 dark:bg-[#0f172a]/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/30">
              <BedDouble className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/90 leading-none">
                {roomType.title}
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 mb-1.5 uppercase tracking-wide">
              Available Rooms
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVal((v) => Math.max(0, Number(v) - 1))}
                className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted text-foreground/70 flex items-center justify-center text-lg font-bold transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max={roomType.count_of_rooms}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-border bg-background/60 text-center text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-green-400/50"
              />
              <button
                type="button"
                onClick={() =>
                  setVal((v) =>
                    Math.min(roomType.count_of_rooms, Number(v) + 1),
                  )
                }
                className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted text-foreground/70 flex items-center justify-center text-lg font-bold transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/50 text-center mt-1.5">
              Max capacity: <strong>{roomType.count_of_rooms}</strong>
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-md shadow-green-500/25"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Pushing to Channex…
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save & Push
              </>
            )}
          </Button>
        </form>
      </div>
    </>
  );
};
