import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveProperty } from "@/features/property-owner/context/PropertyContext";
import { useNotifications } from "./useNotifications";
import { formatNotificationTime, getNotificationPresentation } from "../utils/notificationPresentation";

export function useNotificationBell() {
  const { selectedPropertyId } = useActiveProperty();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, notificationsUpdatedAt } = useNotifications(selectedPropertyId);

  const items = notifications.map((notification) => ({
    id: notification.id,
    ...getNotificationPresentation(notification.type),
    message: notification.message || "You have a new notification.",
    isUnread: notification.status === "unread",
    timeLabel: formatNotificationTime(notification.created_at, notificationsUpdatedAt),
  }));

  const handleNotificationClick = (item) => {
    const notification = notifications.find((entry) => entry.id === item.id);
    if (!notification) return;
    if (notification.status === "unread") markAsRead(notification.id);
    setOpen(false);

    if (notification.type === "booking_modified") {
      navigate("/dashboard/bookings", {
        state: {
          openModifiedBookingId: notification.booking_id,
          openModifiedModal: true,
          timestamp: Date.now(),
        },
      });
    } else {
      // Sync incidents can exist before a local booking is saved.
      setSelected({ ...item, propertyId: selectedPropertyId });
    }
  };

  return {
    open, setOpen, items, unreadCount, markAllAsRead, isLoading, handleNotificationClick,
    selectedNotification: selected?.propertyId === selectedPropertyId ? selected : null,
    closeDetails: () => setSelected(null),
  };
}
