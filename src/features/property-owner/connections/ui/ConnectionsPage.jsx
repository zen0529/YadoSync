import { useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { connectPlatform, disconnectPlatform } from "../queries";
import { useMyProperty, useConnections } from "../hooks/useConnections";

const PLATFORMS = [
  { id: "booking",     name: "Booking.com",  initials: "BK", bgClass: "bg-[#003580]",  textClass: "text-white" },
  { id: "agoda",       name: "Agoda",        initials: "AG", bgClass: "bg-[#e61e28]",  textClass: "text-white" },
  { id: "airbnb",      name: "Airbnb",       initials: "AB", bgClass: "bg-[#ff5a5f]",  textClass: "text-white" },
  { id: "traveloka",   name: "Traveloka",    initials: "TV", bgClass: "bg-[#0064d2]",  textClass: "text-white" },
  { id: "expedia",     name: "Expedia",      initials: "EX", bgClass: "bg-[#00355f]",  textClass: "text-white" },
  { id: "klook",       name: "Klook",        initials: "KL", bgClass: "bg-[#ff5010]",  textClass: "text-white" },
  { id: "tripadvisor", name: "TripAdvisor",  initials: "TA", bgClass: "bg-[#34e0a1]",  textClass: "text-gray-900" },
  { id: "vrbo",        name: "VRBO",         initials: "VB", bgClass: "bg-[#175adc]",  textClass: "text-white" },
];

const timeAgo = (dateString) => {
  if (!dateString) return null;
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const PlatformRow = ({ platform, connection, propertyId, onNotify, onRefresh }) => {
  const isConnected = connection?.connection_status === "connected";
  const [expanded, setExpanded] = useState(false);
  const [externalId, setExternalId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConnect = async () => {
    if (!externalId.trim()) return;
    setConnecting(true);
    try {
      await connectPlatform({ propertyId, platform: platform.id, externalPropertyId: externalId.trim() });
      setExpanded(false);
      setExternalId("");
      onNotify("success", `${platform.name} connected successfully`);
      onRefresh();
    } catch {
      onNotify("error", "Could not connect — please check your Property ID");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectPlatform({ propertyId, platform: platform.id });
      setShowConfirm(false);
      onNotify("success", `${platform.name} disconnected`);
      onRefresh();
    } catch {
      onNotify("error", "Something went wrong. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <div className={`rounded-xl transition-colors border-l-[3px] ${isConnected ? "border-l-green-500" : "border-l-white/20 dark:border-l-white/10"}`}>
        {/* Main row */}
        <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition-colors rounded-r-xl">
          {/* Platform logo */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${platform.bgClass} ${platform.textClass}`}>
            {platform.initials}
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground/85">{platform.name}</p>
            {isConnected ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  Connected
                </span>
                {(connection.external_property_id || connection.connected_at) && (
                  <span className="text-[11px] text-muted-foreground/50">
                    {connection.external_property_id && `Property ID: ${connection.external_property_id}`}
                    {connection.external_property_id && connection.connected_at && " · "}
                    {connection.connected_at && `Connected ${timeAgo(connection.connected_at)}`}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400/70 shrink-0" />
                <span className="text-xs text-muted-foreground/60">Not connected</span>
                <span className="text-[11px] text-muted-foreground/40">
                  · Connect your {platform.name} account via Beds24
                </span>
              </div>
            )}
          </div>

          {/* Action button */}
          {isConnected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(true)}
              className="text-xs h-8 shrink-0 text-muted-foreground/70 hover:text-red-500 hover:border-red-300 dark:hover:border-red-400/50 transition-colors"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => { setExpanded(v => !v); if (expanded) setExternalId(""); }}
              className="text-xs h-8 shrink-0 bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20"
            >
              + Connect
            </Button>
          )}
        </div>

        {/* Expandable connect form */}
        {expanded && !isConnected && (
          <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-white/5 rounded-br-xl">
            <p className="text-xs text-muted-foreground/70 mb-2">
              Enter your {platform.name} Property ID from Beds24:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={externalId}
                onChange={e => setExternalId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleConnect()}
                placeholder="Property ID"
                className="flex-1 h-9 px-3 rounded-lg border border-white/20 bg-white/10 dark:bg-white/5 text-sm text-foreground/85 placeholder:text-muted-foreground/40 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/20 transition-all"
              />
              <Button
                size="sm"
                disabled={!externalId.trim() || connecting}
                onClick={handleConnect}
                className="h-9 bg-green-500/90 hover:bg-green-600 text-white text-xs shrink-0 disabled:opacity-50"
              >
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
              </Button>
            </div>
            <button
              onClick={() => { setExpanded(false); setExternalId(""); }}
              className="mt-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Disconnect confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {platform.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Bookings from {platform.name} will no longer sync. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { property, loading: propLoading } = useMyProperty(user?.id);
  const { connections, loading: connLoading, refetch } = useConnections(property?.id);
  const [notification, setNotification] = useState(null);

  const loading = propLoading || connLoading;
  const isBeds24Connected = !!property?.beds24_property_id;
  const connectedCount = connections.filter(c => c.connection_status === "connected").length;

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const getConnection = (platformId) =>
    connections.find(c => c.platform === platformId) || null;

  return (
    <>
      {/* Inline notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          notification.type === "success"
            ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700/50 dark:text-green-200"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700/50 dark:text-red-200"
        }`}>
          {notification.type === "success"
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {notification.message}
        </div>
      )}

      {/* Description + Beds24 status pill */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <p className="text-sm text-muted-foreground/70 max-w-lg">
          Connect your OTA platform accounts to YadoManagement. Once connected, bookings from each platform will be synced automatically in real time.
        </p>
        {!propLoading && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 ${
            isBeds24Connected
              ? "bg-[#f0faf0] border-[#97C459] text-[#27500A] dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300"
              : "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-300"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBeds24Connected ? "bg-green-500" : "bg-amber-400"}`} />
            {isBeds24Connected ? "Beds24 connected" : "Beds24 not connected"}
          </div>
        )}
      </div>

      {/* OTA Platforms section */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/20 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground/85">OTA Platforms</h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Connect the platforms where your property is listed.
            </p>
          </div>
          {!loading && property && (
            <span className="text-xs text-muted-foreground/50 shrink-0 mt-0.5">
              {connectedCount} / {PLATFORMS.length} connected
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : !property ? (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground/60">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No property found. Please add a property in Settings before managing connections.
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-1.5">
            {PLATFORMS.map(p => (
              <PlatformRow
                key={p.id}
                platform={p}
                connection={getConnection(p.id)}
                propertyId={property.id}
                onNotify={notify}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
