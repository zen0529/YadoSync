import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleTest } from "../utils";

const CHANNEL_ID = "BookingCom";

// ── Booking.com General Settings ───────────────────────────────────────────────
const BookingComGenSet = ({ channel, platform, onSuccess, onClose }) => {
  const [hotelId, setHotelId] = useState("");
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [error, setError] = useState(null);

  const onTest = () =>
    handleTest({
      hotelId,
      channelId: CHANNEL_ID,
      setTesting,
      setError,
      setTested,
    });

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable fields area */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-4">
          {/* Hotel ID field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/80">
              Booking.com Hotel ID <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-muted-foreground/55">
              Enter the property ID from your Booking.com extranet account.
            </p>
            <div className="mt-1">
              <input
                type="text"
                value={hotelId}
                onChange={(e) => {
                  setHotelId(e.target.value);
                  setTested(false);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && onTest()}
                placeholder="e.g. 1234567"
                className="w-full h-9 px-3 rounded-lg border border-white/20 bg-white/10 dark:bg-white/5 text-sm text-foreground/85 placeholder:text-muted-foreground/40 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/20 transition-all"
              />
            </div>
          </div>

          {/* Test Connection Button & Feedback */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex justify-end">
              <Button
                type="button"
                variant=""
                onClick={onTest}
                disabled={!hotelId.trim() || testing}
                className="h-9 text-xs text-black/60 dark:text-black/50 hover:cursor-pointer bg-white font-medium hover:bg-gray-100 min-w-[120px]"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Test Connection"
                )}
              </Button>
            </div>

            {tested && (
              <div className="flex items-center justify-end gap-2 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Connection successful — credentials verified
              </div>
            )}
            {error && (
              <div className="flex items-start justify-end gap-2 text-xs text-red-500 dark:text-red-400">
                <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer — always visible at bottom */}
      <div className="shrink-0 pt-4 border-t border-white/10">
        <Button
          className="w-full h-10 text-sm bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20 transition-all"
          disabled={!tested}
          onClick={() =>
            onSuccess?.({
              hotelId: hotelId.trim(),
            })
          }
        >
          Save & Continue <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
};

export default BookingComGenSet;
