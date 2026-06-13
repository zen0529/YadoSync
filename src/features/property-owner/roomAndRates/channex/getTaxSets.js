const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Fetches all Tax Sets for a given Channex property.
 *
 * GET /api/v1/tax_sets?filter[property_id]=:channexPropertyId
 *
 * @param {string} channexPropertyId - The Channex property UUID
 * @returns {Array} Array of tax set objects from Channex
 */
export const getTaxSets = async (channexPropertyId) => {
  const response = await fetch(
    `${CHANNEX_BASE_URL}/api/v1/tax_sets?filter[property_id]=${channexPropertyId}`,
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
      `Failed to fetch tax sets (${response.status})`
    );
  }

  const data = await response.json();
  return data?.data || [];
};
