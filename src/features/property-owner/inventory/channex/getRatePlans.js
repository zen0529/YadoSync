const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Fetches all rate plans for a given Channex property.
 *
 * GET /api/v1/rate_plans?filter[property_id]=:channexPropertyId
 *
 * @param {string} channexPropertyId - The Channex property UUID
 * @returns {Array} Array of rate plan objects from Channex
 */
export const getRatePlans = async (channexPropertyId) => {
  const response = await fetch(
    `${CHANNEX_BASE_URL}/api/v1/rate_plans?filter[property_id]=${channexPropertyId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "user-api-key": CHANNEX_API_KEY,
      },
    }
  );

  if (!response.ok) {
    let errorBody;
    try { errorBody = await response.json(); } catch { /* ignore */ }
    throw new Error(
      errorBody?.errors?.title ||
      `Failed to fetch rate plans (${response.status})`
    );
  }

  const data = await response.json();
  return data?.data || [];
};
