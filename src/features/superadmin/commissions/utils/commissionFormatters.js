/**
 * Utility functions for formatting commission data and financial numbers.
 */

/**
 * Formats a numeric amount with the given currency symbol.
 * Defaults to '₱' if currency is 'PHP' or omitted.
 *
 * @param {number} amount
 * @param {string} [currency='PHP']
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = "PHP") => {
  const num = Number(amount) || 0;
  const symbol = currency === "PHP" || currency === "₱" ? "₱" : `${currency} `;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats a percentage value (e.g. 15 -> "15%").
 *
 * @param {number} rate
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (rate) => {
  const num = Number(rate) || 0;
  return `${num.toFixed(num % 1 === 0 ? 0 : 1)}%`;
};

/**
 * Formats a date string to a clean localized representation.
 *
 * @param {string} dateStr
 * @returns {string} Formatted date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};
