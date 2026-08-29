import { useState, useEffect } from "react";
import {
  X,
  Settings2,
  Map,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { testChannelConnection } from "../queries";
import ChannelMapping from "./ChannelMapping";
import ChannelSettings from "./ChannelSettings";

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: "general", label: "General Settings", icon: Settings2 },
  { id: "mapping", label: "Mapping", icon: Map },
  { id: "channel", label: "Channel Settings", icon: SlidersHorizontal },
];

// ── Advanced Settings constants ────────────────────────────────────────────────
const ADVANCED_SETTINGS_OPTIONS = [
  { id: "allow_vcc_updates", label: "Allow VCC Updates" },
  { id: "allow_payout_updates", label: "Allow Payout Updates" },
  { id: "allow_payout_method_updates", label: "Allow Payout Method Updates" },
  { id: "allow_vcc_balance", label: "Allow VCC Balance" },
  { id: "allow_vcc_fees_payout", label: "Allow VCC Fees Payout" },
];

// ── General Settings tab ───────────────────────────────────────────────────────
const GeneralSettingsTab = ({ platform, onSuccess, onClose }) => {
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

  const handleTest = async () => {
    if (!hotelId.trim()) return;
    setTesting(true);
    setError(null);
    setTested(false);
    try {
      await testChannelConnection({
        platform: platform.id,
        hotelId: hotelId.trim(),
      });
      setTested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleAdvancedToggle = (id) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col gap-6 h-full">
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
            {platform.name} Hotel ID <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-muted-foreground/55">
            Enter the property ID from your {platform.name} extranet account.
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
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
              placeholder={
                platform.id === "booking" ? "e.g. 1234567" : "Hotel ID"
              }
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
              send booking notification email
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
              onClick={handleTest}
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

      <div className="flex-1" />

      {/* Footer */}
      <div className="pt-4 border-t border-white/10">
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

// ── Channel Panel ──────────────────────────────────────────────────────────────
// Always rendered in the DOM. Slides in/out via CSS transition controlled by `open`.
export const ChannelPanel = ({
  open,
  platform,
  property,
  onSuccess,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("general");

  // Reset tab when panel reopens
  useEffect(() => {
    if (open) setActiveTab("general");
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[600px] flex flex-col
          bg-background/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl
          border-l border-black/5 dark:border-white/10 shadow-2xl
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${platform?.bgClass} ${platform?.textClass}`}
            >
              {platform?.initials}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                Connect {platform?.name}
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Channel configuration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-3 border-b border-black/5 dark:border-white/10 shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === id
                  ? "bg-green-500 text-white shadow-md shadow-green-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {activeTab === "general" && platform && (
            <GeneralSettingsTab
              platform={platform}
              property={property}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}
          {activeTab === "mapping" && (
            <ChannelMapping platform={platform} property={property} />
          )}
          {activeTab === "channel" && (
            <ChannelSettings platform={platform} property={property} />
          )}
        </div>
      </div>
    </>
  );
};

export default ChannelPanel;
