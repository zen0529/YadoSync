/** Return today's date string (YYYY-MM-DD) in UTC */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
