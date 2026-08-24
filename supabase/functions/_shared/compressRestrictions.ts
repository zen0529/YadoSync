/**
 * _shared/compressRestrictions.ts
 *
 * Run-length encodes consecutive restriction entries into date_from/date_to ranges.
 */

import type { RestrictionEntry, RestrictionRange } from "./types.ts";

/** Returns true if `next` is exactly the calendar day after `current` (UTC) */
function isNextDay(current: string, next: string): boolean {
  const a = new Date(current + "T00:00:00Z");
  const b = new Date(next + "T00:00:00Z");
  return b.getTime() - a.getTime() === 86_400_000;
}

function restrictionsEqual(a: RestrictionEntry, b: RestrictionEntry): boolean {
  return (
    a.rate === b.rate &&
    a.min_stay_arrival === b.min_stay_arrival &&
    a.min_stay_through === b.min_stay_through &&
    a.max_stay === b.max_stay &&
    a.stop_sell === b.stop_sell &&
    a.closed_to_arrival === b.closed_to_arrival &&
    a.closed_to_departure === b.closed_to_departure
  );
}

function buildRestrictionRange(
  dateFrom: string,
  dateTo: string,
  e: RestrictionEntry,
): RestrictionRange {
  const range: RestrictionRange = { date_from: dateFrom, date_to: dateTo };
  range.rate = e.rate;
  if (e.min_stay_arrival !== undefined)
    range.min_stay_arrival = e.min_stay_arrival;
  if (e.min_stay_through !== undefined)
    range.min_stay_through = e.min_stay_through;
  if (e.max_stay !== undefined) range.max_stay = e.max_stay;
  if (e.stop_sell !== undefined) range.stop_sell = e.stop_sell;
  if (e.closed_to_arrival !== undefined)
    range.closed_to_arrival = e.closed_to_arrival;
  if (e.closed_to_departure !== undefined)
    range.closed_to_departure = e.closed_to_departure;
  return range;
}

/**
 * compressRestrictions — run-length encodes consecutive entries where ALL
 * restriction fields are equal into date_from/date_to ranges.
 *
 * Compares the full value object so a stop_sell change correctly breaks a
 * range even when the rate is unchanged.
 *
 * Input MUST be sorted ascending by date.
 */
export function compressRestrictions(
  entries: RestrictionEntry[],
): RestrictionRange[] {
  if (entries.length === 0) return [];

  console.log("compress restrictions entries", entries);

  const ranges: RestrictionRange[] = [];
  let rangeStart = entries[0].date;
  let rangeEnd = entries[0].date;
  let ref = entries[0];

  for (let i = 1; i < entries.length; i++) {
    const e = entries[i];
    if (restrictionsEqual(ref, e) && isNextDay(rangeEnd, e.date)) {
      rangeEnd = e.date;
    } else {
      ranges.push(buildRestrictionRange(rangeStart, rangeEnd, ref));
      rangeStart = e.date;
      rangeEnd = e.date;
      ref = e;
    }
  }
  ranges.push(buildRestrictionRange(rangeStart, rangeEnd, ref));
  return ranges;
}
