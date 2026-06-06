const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Deletes a property via the Channex API.
 *
 * DELETE https://staging.channex.io/api/v1/properties/:id
 *
 * @param {string} id - The Channex property ID
 * @returns {boolean} - True if deleted successfully
 */
export const deleteProperty = async (id) => {
  const response = await fetch(`${CHANNEX_BASE_URL}/api/v1/properties/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "user-api-key": CHANNEX_API_KEY,
    },
  });

  console.log("The deletion resposne", response);

  if (response.status === 200) {
    return true;
  }

  throw new Error(`Failed to delete property from Channex (${response.status})`);
};
