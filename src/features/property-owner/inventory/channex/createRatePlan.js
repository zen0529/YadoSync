const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Creates a new rate plan in Channex.
 *
 * POST /api/v1/rate_plans
 *
 * @param {string} channexPropertyId  - The Channex property UUID
 * @param {string} channexRoomTypeId  - The Channex room type UUID
 * @param {object} form               - Rate plan form values
 * @returns {object} The created rate plan data from Channex
 */
export const createRatePlan = async (channexPropertyId, channexRoomTypeId, form) => {
  const payload = {
    rate_plan: {
      property_id: channexPropertyId,
      room_type_id: channexRoomTypeId,
      title: form.title,
      currency: form.currency || "PHP",
      sell_mode: form.sell_mode || "per_room",
      rate_mode: form.rate_mode || "manual",
    },
  };

  const response = await fetch(`${CHANNEX_BASE_URL}/api/v1/rate_plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-api-key": CHANNEX_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 201 || response.status === 200) {
    const data = await response.json();
    return data;
  }

  let errorBody;
  try {
    errorBody = await response.json();

  } catch { /* ignore */

  }

  if (response.status === 422) {
    const details = errorBody?.errors?.details;
    if (details) {
      const fieldMessages = Object.entries(details)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join(" | ");
      throw new Error(`Validation error — ${fieldMessages}`);
    }
  }

  throw new Error(
    errorBody?.errors?.title ||
    `Failed to create rate plan (${response.status})`
  );
};
