const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Deletes a room type from Channex.
 *
 * DELETE /api/v1/room_types/:id
 *
 * @param {string} channexRoomTypeId - The Channex room type UUID
 * @returns {void}
 */
export const deleteRoomType = async (channexRoomTypeId) => {
  const response = await fetch(
    `${CHANNEX_BASE_URL}/api/v1/room_types/${channexRoomTypeId}`,
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
    `Failed to delete room type (${response.status})`
  );
};
