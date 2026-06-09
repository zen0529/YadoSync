const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Updates an existing room type in Channex.
 *
 * PUT /api/v1/room_types/:id
 *
 * @param {string} channexRoomTypeId - The Channex room type UUID
 * @param {object} form - Room type form values
 * @returns {object} The updated room type data from Channex
 */
export const updateRoomType = async (channexRoomTypeId, form) => {
  const payload = {
    room_type: {
      title: form.title,
      count_of_rooms: Number(form.count_of_rooms) || 1,
      occ_adults: Number(form.occ_adults) || 2,
      occ_children: Number(form.occ_children) || 0,
      occ_infants: Number(form.occ_infants) || 0,
      default_occupancy: Number(form.default_occupancy) || 2,
      capacity: Number(form.capacity) || null,
      room_kind: form.room_kind || "room",
      content: {
        description: form.description || undefined,
        photos: form.content?.photos?.length > 0 ? form.content.photos : undefined,
      },
    },
  };

  const response = await fetch(
    `${CHANNEX_BASE_URL}/api/v1/room_types/${channexRoomTypeId}`,
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
    `Failed to update room type (${response.status})`
  );
};
