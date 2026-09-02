import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { handleTest } from "../utils";

// ── Step 1 — Hotel ID + Test Connection ───────────────────────────────────────
const Step1Credentials = ({ channel, platform, onNext, onClose }) => {
  const currentChannel = channel || platform;
  const [hotelId, setHotelId] = useState("");
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [error, setError] = useState(null);

  const onTest = () =>
    handleTest({
      hotelId,
      channelId: currentChannel.id,
      setTesting,
      setError,
      setTested,
    });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-medium text-foreground/70 mb-1.5">
          {platform.name} Hotel ID
        </label>
        <p className="text-xs text-muted-foreground/60 mb-3">
          Enter the property ID from your {platform.name} extranet account.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={hotelId}
            onChange={(e) => { setHotelId(e.target.value); setTested(false); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && onTest()}
            placeholder={platform.name ? `${platform.name} Hotel ID` : "Hotel ID"}
            className="flex-1 h-9 px-3 rounded-lg border border-white/20 bg-white/10 dark:bg-white/5 text-sm text-foreground/85 placeholder:text-muted-foreground/40 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/20 transition-all"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={onTest}
            disabled={!hotelId.trim() || testing}
            className="h-9 text-xs shrink-0"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test"}
          </Button>
        </div>

        {/* Test result feedback */}
        {tested && (
          <div className="mt-2.5 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Connection successful — credentials verified
          </div>
        )}
        {error && (
          <div className="mt-2.5 flex items-start gap-2 text-xs text-red-500 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors"
        >
          Cancel
        </button>
        <Button
          size="sm"
          disabled={!tested}
          onClick={() => onNext({ hotelId: hotelId.trim() })}
          className="h-8 text-xs bg-green-500/90 hover:bg-green-600 text-white"
        >
          Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Step1Credentials;
