const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Updates an existing rate plan in Channex.
 *
 * PUT /api/v1/rate_plans/:id
 *
 * @param {string} channexRatePlanId - The Channex rate plan UUID
 * @param {object} form              - Rate plan form values
 * @returns {object} The updated rate plan data from Channex
 */
export const updateRatePlan = async (channexRatePlanId, form) => {
  const payload = {
    rate_plan: {
      title:     form.title,
      currency:  form.currency || "PHP",
      sell_mode: form.sell_mode || "per_room",
      rate_mode: form.rate_mode || "manual",
    },
  };

  const response = await fetch(
    `${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": CHANNEX_API_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  let errorBody;
  try { errorBody = await response.json(); } catch { /* ignore */ }

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
    `Failed to update rate plan (${response.status})`
  );
};
