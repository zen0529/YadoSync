/**
 * _shared/dateRange.ts
 *
 * Generates an array of YYYY-MM-DD date strings over a given range.
 */

/**
 * Generate an array of YYYY-MM-DD strings from startDate (inclusive)
 * for `days` days.
 */
export function dateRange(startDate: string, days: number): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00Z");
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
