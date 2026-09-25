export type StoredAvailability = { date: string; available: number };

export function buildAvailabilityWindow(
  dates: string[],
  storedRows: StoredAvailability[],
  defaultAvailability: number,
) {
  const storedByDate = new Map(storedRows.map((row) => [row.date, row.available]));
  const missingDates = dates.filter((date) => !storedByDate.has(date));
  const entries = dates.map((date) => ({
    date,
    available: storedByDate.get(date) ?? defaultAvailability,
  }));

  return { entries, missingDates };
}
