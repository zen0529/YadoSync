/**
 * src/features/superadmin/logs/utils/formatters.js
 *
 * Feature-specific pure helper functions for date/time formatting and status color mapping.
 */

/**
 * Format ISO string to human-readable date & time (e.g. "Sep 19, 2026, 1:45 PM")
 */
export function formatDateTime(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

/**
 * Format ISO string to time only (e.g. "01:45:12 PM")
 */
export function formatTime(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

/**
 * Return relative time string (e.g., "5m ago", "2h ago", "yesterday")
 */
export function timeAgo(isoString) {
  if (!isoString) return "—";
  try {
    const now = Date.now();
    const past = new Date(isoString).getTime();
    if (isNaN(past)) return "—";

    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return "—";
  }
}

/**
 * Return tailwind style classes for a log status string
 */
export function getStatusStyle(status) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "ok":
    case "success":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "partial":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "failed":
    case "error":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
    default:
      return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20";
  }
}
