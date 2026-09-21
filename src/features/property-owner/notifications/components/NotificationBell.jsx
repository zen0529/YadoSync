/**
 * src/features/property-owner/notifications/components/NotificationBell.jsx
 *
 * Notification bell dropdown in the dashboard header.
 * Shows unread badge, real-time alert list, and quick navigation.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  AlertTriangle,
  CalendarCheck,
  Info,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useActiveProperty } from "@/features/property-owner/context/PropertyContext";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationBell() {
  const { activeProperty } = useActiveProperty();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
  } = useNotifications(activeProperty?.id);

  const handleNotificationClick = (notification) => {
    if (notification.status === "unread") {
      markAsRead(notification.id);
    }
    setOpen(false);

    if (notification.type === "booking_modified" || notification.booking_id) {
      navigate("/dashboard/bookings");
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="View notifications"
          className="relative w-9 h-9 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-700 dark:text-zinc-300 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-xs animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl bg-card border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/50">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Bell className="w-4 h-4 opacity-50" />
              </div>
              <p className="text-xs font-medium text-foreground">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground">
                Incoming OTA booking changes and alerts will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.status === "unread";
              const isModified = notif.type === "booking_modified";

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 flex gap-3 items-start cursor-pointer transition-colors ${
                    isUnread
                      ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isModified
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {isModified ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Info className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs leading-snug truncate ${
                          isUnread
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground/80"
                        }`}
                      >
                        {isModified ? "Booking Modified" : "Notification"}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimestamp(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message || "An OTA reservation was updated."}
                    </p>

                    {isModified && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <span>Review details</span>
                        <span>→</span>
                      </div>
                    )}
                  </div>

                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
