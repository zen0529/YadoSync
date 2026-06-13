const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Creates an individual Tax entry within a Tax Set in Channex.
 *
 * POST /api/v1/taxes
 *
 * @param {object} params
 * @param {string} params.taxSetId          - Channex Tax Set UUID
 * @param {string} params.propertyId        - Channex Property UUID
 * @param {string} params.title             - e.g. "VAT"
 * @param {string} params.logic             - "percent" | "per_room" | "per_person"
 * @param {string} params.type              - "tax" | "city_tax" | "fee"
 * @param {string} params.rate              - e.g. "20.00"
 * @param {boolean} params.isInclusive      - whether tax is inclusive of the rate
 * @param {number} params.skipNights        - number of nights to skip before applying
 * @param {number} params.maxNights         - max nights to apply the tax
 * @param {Array}  params.applicableDateRanges - [{ after, before }]
 * @returns {object} Created tax data from Channex
 */
export const createTax = async ({
  taxSetId,
  propertyId,
  title,
  logic,
  type,
  rate,
  isInclusive,
  skipNights,
  maxNights,
  applicableDateRanges,
}) => {
  const body = {
    tax: {
      tax_set_id:              taxSetId,
      property_id:             propertyId,
      title,
      logic,
      type,
      rate,
      is_inclusive:            isInclusive,
      skip_nights:             skipNights,
      max_nights:              maxNights,
      applicable_date_ranges:  applicableDateRanges || [],
    },
  };

  const response = await fetch(`${CHANNEX_BASE_URL}/api/v1/taxes`, {
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
    `Failed to create tax (${response.status})`
  );
};
