import { useState, useEffect } from "react";
import { X, Settings2, Map, SlidersHorizontal } from "lucide-react";
import ChannelMapping from "./ChannelMapping";
import ChannelSettings from "./ChannelSettings";
import GeneralSettingsTab from "./GeneralSettingsTab";

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: "general", label: "General Settings", icon: Settings2 },
  { id: "mapping", label: "Mapping", icon: Map },
  { id: "channel", label: "Channel Settings", icon: SlidersHorizontal },
];

// ── Channel Panel ──────────────────────────────────────────────────────────────
// Always rendered in the DOM. Slides in/out via CSS transition controlled by `open`.
export const ChannelPanel = ({
  open,
  channel,
  platform,
  connection,
  property,
  onSuccess,
  onClose,
}) => {
  const currentChannel = channel || platform;
  const [activeTab, setActiveTab] = useState("general");
  const [hotelId, setHotelId] = useState(connection?.ota_hotel_id || "");

  // Reset tab and sync hotelId when panel opens or connection changes
  useEffect(() => {
    if (open) {
      if (connection?.connection_status === "connected") {
        setActiveTab("mapping");
      } else {
        setActiveTab("general");
      }
      if (connection?.ota_hotel_id) {
        setHotelId(connection.ota_hotel_id);
      }
    }
  }, [open, connection?.connection_status, connection?.ota_hotel_id]);

  const handleGeneralSuccess = (data) => {
    if (data?.hotelId) {
      setHotelId(data.hotelId);
    }
    // Auto-advance to mapping tab upon saving/testing hotel ID
    setActiveTab("mapping");
  };

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
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${currentChannel?.bgClass} ${currentChannel?.textClass}`}
            >
              {currentChannel?.initials}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                Connect {currentChannel?.name}
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
          {activeTab === "general" && currentChannel && (
            <GeneralSettingsTab
              channel={currentChannel}
              platform={currentChannel}
              property={property}
              onSuccess={handleGeneralSuccess}
              onClose={onClose}
            />
          )}
          {activeTab === "mapping" && (
            <ChannelMapping
              platform={currentChannel}
              property={property}
              hotelId={hotelId}
              connection={connection}
              onNavigateToGeneral={() => setActiveTab("general")}
              onSuccess={onSuccess}
            />
          )}
          {activeTab === "channel" && (
            <ChannelSettings platform={currentChannel} property={property} />
          )}
        </div>
      </div>
    </>
  );
};

export default ChannelPanel;
