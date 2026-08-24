export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Convert Date object to YYYY-MM-DD string */
export const toDateStr = (d) => d.toISOString().slice(0, 10);

/** Add days to a Date object in UTC */
export const addDays = (d, n) => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
};

/** First day of a month (UTC) */
export const firstOfMonth = (year, month) => new Date(Date.UTC(year, month, 1));

/** Number of days in a month */
export const daysInMonth = (year, month) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
