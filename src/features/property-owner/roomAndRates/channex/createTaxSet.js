const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Creates a new Tax Set in Channex.
 *
 * POST /api/v1/tax_sets
 *
 * @param {object} payload - { title, currency, property_id }
 * @returns {object} Created tax set data from Channex
 */
export const createTaxSet = async ({ title, currency, propertyId }) => {
  const body = {
    tax_set: {
      title,
      currency,
      property_id: propertyId,
    },
  };

  const response = await fetch(`${CHANNEX_BASE_URL}/api/v1/tax_sets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-api-key": CHANNEX_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 201 || response.status === 200) {
    return await response.json();
  }

  let errorBody;
  try { errorBody = await response.json(); } catch { /* ignore */ }

  if (response.status === 422) {
    const details = errorBody?.errors?.details;
    if (details) {
      const fieldMessages = Object.entries(details)
        .map(([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join(" | ");
      throw new Error(`Validation error — ${fieldMessages}`);
    }
  }

  throw new Error(
    errorBody?.errors?.title ||
    `Failed to create tax set (${response.status})`
  );
};
