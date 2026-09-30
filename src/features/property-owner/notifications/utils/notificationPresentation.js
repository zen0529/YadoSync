export const getNotificationPresentation = (type) => {
  switch (type) {
    case "booking_modified":
      return { title: "Booking Modified", tone: "warning", action: "modified" };
    case "booking_sync_issue":
      return { title: "Booking Sync Delayed", tone: "warning", action: "sync" };
    case "booking_sync_restored":
      return { title: "Booking Sync Restored", tone: "success", action: "sync" };
    default:
      return { title: "Notification", tone: "info", action: "details" };
  }
};

export const formatNotificationTime = (dateString, now) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return "";
  const minutes = Math.floor((now - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
