/**
 * src/features/property-owner/notifications/hooks/useNotifications.js
 *
 * TanStack Query + Supabase Realtime hook for property notifications.
 * Acts as the dedicated bridge between UI, cache, and real-time alerts.
 */

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getNotificationPresentation } from "../utils/notificationPresentation";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../supabase";

/**
 * Hook to manage property notifications with instant Realtime alerts.
 *
 * @param {string} propertyId - The active property ID
 */
export function useNotifications(propertyId) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["notifications", propertyId],
    queryFn: () => fetchNotifications({ propertyId }),
    enabled: Boolean(propertyId),
    staleTime: 30_000,
    refetchInterval: 60_000,
    throwOnError: false,
  });

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", propertyId] });
    },
    onError: (err) => {
      console.error("[useNotifications] Failed to mark notification as read:", err);
    },
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", propertyId] });
    },
    onError: (err) => {
      console.error("[useNotifications] Failed to mark all notifications as read:", err);
    },
  });

  // Supabase Realtime subscription for incoming notifications
  useEffect(() => {
    if (!propertyId) return;

    const channel = supabase
      .channel(`realtime-notifications-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notifications", propertyId] });

          const newNotif = payload.new;
          if (payload.eventType !== "INSERT" || newNotif?.channel !== "in_app") return;
          if (newNotif?.type === "booking_modified") {
            // Invalidate bookings cache immediately
            queryClient.invalidateQueries({ queryKey: ["bookings"] });

            // Surface real-time toast with action shortcut
            toast.warning("Booking Modification Received", {
              description:
                newNotif.message ||
                "An OTA reservation was modified. Please review room assignments.",
              action: {
                label: "Review",
                onClick: () => navigate("/dashboard/bookings", {
                  state: { openModifiedBookingId: newNotif.booking_id, openModifiedModal: true, timestamp: Date.now() },
                }),
              },
              duration: 8000,
            });
          } else if (newNotif.type === "booking_sync_issue" || newNotif.type === "booking_sync_restored") {
            const presentation = getNotificationPresentation(newNotif.type);
            if (newNotif.type === "booking_sync_restored") {
              queryClient.invalidateQueries({ queryKey: ["bookings"] });
            }
            toast[presentation.tone === "success" ? "success" : "warning"](presentation.title, {
              description: newNotif.message,
              duration: 8000,
            });
          } else {
            toast.info("New Notification", {
              description: newNotif?.message || "You have a new notification.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient, navigate]);

  return {
    notifications,
    unreadCount,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isLoading,
    notificationsUpdatedAt: dataUpdatedAt,
  };
}
