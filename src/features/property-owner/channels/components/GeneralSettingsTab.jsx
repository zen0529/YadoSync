import BookingComGenSet from "./BookingComGenSet";

// ── Platform → Component map ───────────────────────────────────────────────────
// Add new platform entries here as they are implemented.
const GEN_SET_MAP = {
  BookingCom: BookingComGenSet,
  // airbnb: AirbnbGenSet,
};

// ── General Settings tab (platform router) ─────────────────────────────────────
const GeneralSettingsTab = ({ channel, platform, onSuccess, onClose }) => {
  const currentChannel = channel || platform;
  const PlatformGenSet = GEN_SET_MAP[currentChannel?.id];

  if (!PlatformGenSet) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <p className="text-sm font-medium text-foreground/70">
          General settings not yet available
        </p>
        <p className="text-xs text-muted-foreground/50">
          Support for <span className="font-semibold">{currentChannel?.name}</span> is
          coming soon.
        </p>
      </div>
    );
  }

  return (
    <PlatformGenSet
      channel={currentChannel}
      platform={currentChannel}
      onSuccess={onSuccess}
      onClose={onClose}
    />
  );
};

export default GeneralSettingsTab;
