/**
 * _shared/channex.ts
 *
 * Re-exports all Channex helpers from their individual files.
 * Existing edge functions that import from "../_shared/channex.ts" continue
 * to work without any changes.
 *
 * Individual files:
 *   types.ts                — all shared TypeScript interfaces
 *   channexPost.ts          — POST with retry/backoff
 *   channexGet.ts           — GET with retry/backoff
 *   channexGetWithMeta.ts   — GET returning { data, meta } with retry/backoff
 *   channexPostRaw.ts       — POST returning raw status code with retry/backoff
 *   todayUTC.ts             — today's date string in UTC
 *   dateRange.ts            — generate array of date strings
 *   filterPastDates.ts      — remove entries before today
 *   compressAvailability.ts — run-length encode availability entries
 *   compressRestrictions.ts — run-length encode restriction entries
 */

export type {
  AvailabilityEntry,
  AvailabilityRange,
  RestrictionEntry,
  RestrictionRange,
  RestrictionRangePerPerson,
  BookingRoom,
  BookingRevisionAttributes,
  BookingRevision,
  BookingRevisionFeedMeta,
  BookingRevisionFeed,
} from "./types.ts";

export { channexPost }       from "./channexPost.ts";
export { channexGet }        from "./channexGet.ts";
export { channexGetWithMeta } from "./channexGetWithMeta.ts";
export { channexPostRaw }    from "./channexPostRaw.ts";
export { todayUTC }          from "./todayUTC.ts";
export { dateRange }         from "./dateRange.ts";
export { filterPastDates }   from "./filterPastDates.ts";
export { compressAvailability } from "./compressAvailability.ts";
export { compressRestrictions } from "./compressRestrictions.ts";
