/**
 * _shared/compressAvailability.ts
 *
 * Run-length encodes consecutive availability entries into date_from/date_to ranges.
 */

import type { AvailabilityEntry, AvailabilityRange } from "./types.ts";

/** Returns true if `next` is exactly the calendar day after `current` (UTC) */
function isNextDay(current: string, next: string): boolean {
  const a = new Date(current + "T00:00:00Z");
  const b = new Date(next   + "T00:00:00Z");
  return b.getTime() - a.getTime() === 86_400_000;
}

/** Correct implementation with separate start/end tracking */
function compressAvailabilityCorrect(entries: AvailabilityEntry[]): AvailabilityRange[] {
  if (entries.length === 0) return [];

  const ranges: AvailabilityRange[] = [];
  let rangeStart = entries[0].date;
  let rangeEnd   = entries[0].date;
  let rangeVal   = entries[0].available;

  for (let i = 1; i < entries.length; i++) {
    const { date, available } = entries[i];
    if (available === rangeVal && isNextDay(rangeEnd, date)) {
      rangeEnd = date;
    } else {
      ranges.push({ date_from: rangeStart, date_to: rangeEnd, availability: rangeVal });
      rangeStart = date;
      rangeEnd   = date;
      rangeVal   = available;
    }
  }
  ranges.push({ date_from: rangeStart, date_to: rangeEnd, availability: rangeVal });
  return ranges;
}

/**
 * compressAvailability — run-length encodes consecutive entries with the
 * same `available` count into date_from/date_to ranges.
 *
 * Input MUST be sorted ascending by date.
 * A single date becomes a range where date_from === date_to.
 */
export function compressAvailability(
  entries: AvailabilityEntry[],
): AvailabilityRange[] {
  if (entries.length === 0) return [];

  const ranges: AvailabilityRange[] = [];
  let current = { ...entries[0] };

  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    // Check if this entry is the next calendar day AND same value
    if (
      entry.available === current.available &&
      isNextDay(current.date, entry.date)
    ) {
      // Extend current range
      current = { ...current, date: entry.date };
    } else {
      ranges.push({ date_from: current.date, date_to: current.date, availability: current.available });
      // We overloaded `date` as the running end; re-use entry as new start
      current = { ...entry };
    }
  }
  // Push final segment
  ranges.push({ date_from: current.date, date_to: current.date, availability: current.available });

  // Fix: for multi-day segments we tracked only start in current.date — redo with proper start tracking
  return compressAvailabilityCorrect(entries);
}
