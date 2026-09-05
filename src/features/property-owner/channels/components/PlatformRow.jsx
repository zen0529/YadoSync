import { useState } from "react";
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
import { Link2 } from "lucide-react";
import { disconnectChannelConnection } from "../supabase";
import { timeAgo } from "./timeAgo";

// ── Platform Row ──────────────────────────────────────────────────────────────
const PlatformRow = ({ platform, connection, property, onNotify, onRefresh, onConnect }) => {
  const isConnected = connection?.connection_status === "connected";
  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectChannelConnection({ propertyId: property.id, channel: platform.id });
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
        <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition-colors rounded-r-xl">
          {/* Platform logo */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${platform.bgClass} ${platform.textClass}`}>
            {platform.initials}
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground/85">{platform.name}</p>
              {!platform.supported && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-muted-foreground/50 font-medium">
                  Coming soon
                </span>
              )}
            </div>
            {isConnected ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
                  Connected
                </span>
                {(connection.ota_hotel_id || connection.connected_at) && (
                  <span className="text-[11px] text-muted-foreground/50">
                    {connection.ota_hotel_id && `Hotel ID: ${connection.ota_hotel_id}`}
                    {connection.ota_hotel_id && connection.connected_at && " · "}
                    {connection.connected_at && `Connected ${timeAgo(connection.connected_at)}`}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400/70 shrink-0" />
                <span className="text-xs text-muted-foreground/60">Not connected</span>
                {platform.supported && (
                  <span className="text-[11px] text-muted-foreground/40">
                    · Sync rates &amp; bookings via Channex
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action button */}
          {isConnected ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onConnect(platform)}
                className="text-xs h-8 text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Configure
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm(true)}
                className="text-xs h-8 text-muted-foreground/70 hover:text-red-500 hover:border-red-300 dark:hover:border-red-400/50 transition-colors"
              >
                Disconnect
              </Button>
            </div>
          ) : platform.supported ? (
            <Button
              size="sm"
              onClick={() => onConnect(platform)}
              className="text-xs h-8 shrink-0 bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20"
            >
              <Link2 className="w-3 h-3 mr-1" /> Connect
            </Button>
          ) : (
            <Button
              size="sm"
              disabled
              variant="outline"
              className="text-xs h-8 shrink-0 opacity-40"
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Disconnect confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {platform.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate and remove the channel from Channex. Bookings from{" "}
              {platform.name} will no longer sync. You can reconnect at any time.
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

export default PlatformRow;

