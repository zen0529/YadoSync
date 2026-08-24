/**
 * Returns a human-readable relative time string (e.g. "5m ago", "2h ago").
 * Returns null if no dateString is provided.
 *
 * @param {string|null} dateString - ISO date string
 * @returns {string|null}
 */
export const timeAgo = (dateString) => {
  if (!dateString) return null;
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
