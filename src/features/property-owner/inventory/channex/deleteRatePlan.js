const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Deletes a rate plan from Channex.
 *
 * DELETE /api/v1/rate_plans/:id
 *
 * @param {string} channexRatePlanId - The Channex rate plan UUID
 * @returns {void}
 */
export const deleteRatePlan = async (channexRatePlanId) => {
  const response = await fetch(
    `${CHANNEX_BASE_URL}/api/v1/rate_plans/${channexRatePlanId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": CHANNEX_API_KEY,
      },
    }
  );

  // 204 No Content = success
  if (response.status === 204 || response.ok) return;

  let errorBody;
  try { errorBody = await response.json(); } catch { /* ignore */ }

  throw new Error(
    errorBody?.errors?.title ||
    `Failed to delete rate plan (${response.status})`
  );
};
