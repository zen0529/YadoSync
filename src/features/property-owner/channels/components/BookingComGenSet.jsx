import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVANCED_SETTINGS_OPTIONS } from "../constants";
import { handleTest } from "../utils";

const CHANNEL_ID = "bookingCom";

// ── Booking.com General Settings ───────────────────────────────────────────────
const BookingComGenSet = ({ channel, platform, onSuccess, onClose }) => {
  const [title, setTitle] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [sendNotificationEmail, setSendNotificationEmail] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [advancedSettings, setAdvancedSettings] = useState({
    allow_vcc_updates: false,
    allow_payout_updates: false,
    allow_payout_method_updates: false,
    allow_vcc_balance: false,
    allow_vcc_fees_payout: false,
  });
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

  const handleAdvancedToggle = (id) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable fields area */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-4">
          {/* Title field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/80">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Booking.com Connection"
              className="h-9 px-3 rounded-lg border border-white/20 bg-white/10 dark:bg-white/5 text-sm text-foreground/85 placeholder:text-muted-foreground/40 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/20 transition-all"
            />
          </div>

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

          {/* Send booking notification email */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={sendNotificationEmail}
                onChange={(e) => setSendNotificationEmail(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 dark:bg-white/5 text-green-500 accent-green-500 cursor-pointer focus:ring-green-400/20"
              />
              <span className="text-sm font-medium text-foreground/80">
                Send booking notification email
              </span>
            </label>

            {sendNotificationEmail && (
              <div className="flex flex-col gap-1.5 pl-6 animate-in fade-in duration-200">
                <label className="text-xs font-medium text-foreground/70">
                  Email
                </label>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="e.g. notifications@example.com"
                  required={sendNotificationEmail}
                  className="h-9 px-3 rounded-lg border border-white/20 bg-white/10 dark:bg-white/5 text-sm text-foreground/85 placeholder:text-muted-foreground/40 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/20 transition-all"
                />
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="pt-3 border-t border-black/5 dark:border-white/10 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Advanced Settings
            </h3>
            <div className="flex flex-col gap-2.5">
              {ADVANCED_SETTINGS_OPTIONS.map(({ id, label }) => (
                <label
                  key={id}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={advancedSettings[id]}
                    onChange={() => handleAdvancedToggle(id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 dark:bg-white/5 text-green-500 accent-green-500 cursor-pointer focus:ring-green-400/20"
                  />
                  <span className="text-sm text-foreground/80">{label}</span>
                </label>
              ))}
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
      {/* end scrollable fields */}

      {/* Footer — always visible at bottom */}
      <div className="shrink-0 pt-4 border-t border-white/10">
        <Button
          className="w-full h-10 text-sm bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20 transition-all"
          disabled={!tested}
          onClick={() =>
            onSuccess({
              title: title.trim(),
              hotelId: hotelId.trim(),
              sendNotificationEmail,
              notificationEmail: sendNotificationEmail
                ? notificationEmail.trim()
                : null,
              advancedSettings,
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
