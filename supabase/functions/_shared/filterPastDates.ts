/**
 * _shared/filterPastDates.ts
 *
 * Removes entries with dates strictly before today (UTC).
 * Channex rejects past dates with a 400 — this is the mandatory guard.
 */

import { todayUTC } from "./todayUTC.ts";

/**
 * Remove entries with date strictly before today (UTC).
 * Channex rejects past dates with a 400 — this is the mandatory guard.
 */
export function filterPastDates<T extends { date: string }>(entries: T[]): T[] {
  const today = todayUTC();
  return entries.filter((e) => e.date >= today);
}
