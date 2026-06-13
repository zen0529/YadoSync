const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Fetches all room types for a given Channex property.
 *
 * GET /api/v1/room_types?filter[property_id]=:channexPropertyId
 *
 * @param {string} channexPropertyId - The Channex property UUID
 * @returns {Array} Array of room type objects from Channex
 */
export const getRoomTypes = async (channexPropertyId) => {
  const response = await fetch(
    `${CHANNEX_BASE_URL}/api/v1/room_types?filter[property_id]=${channexPropertyId}`,
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
      `Failed to fetch room types (${response.status})`
    );
  }

  const data = await response.json();
  return data?.data || [];
};
