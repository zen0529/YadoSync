import { supabase } from "@/lib/supabase";

/**
 * Extracts real error message from Supabase FunctionsHttpError (error.context)
 * or falls back to error.message
 */
const parseEdgeFunctionError = async (error) => {
  if (!error) return "Something went wrong. Please try again.";
  try {
    if (error.context && typeof error.context.json === "function") {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch {
    // fallback
  }
  return error.message || "Something went wrong. Please try again.";
};

/**
 * Step 1 — Test OTA credentials against Channex.
 * @param {object} params
 * @param {string} params.channel   e.g. "booking"
 * @param {string} params.hotelId   OTA property/hotel ID (e.g. Booking.com extranet ID)
 */
export const testChannelConnection = async ({ channel, hotelId }) => {
  const { data, error } = await supabase.functions.invoke("testChannelConnection", {
    body: { channel, hotel_id: hotelId },
  });
  if (error) throw new Error(await parseEdgeFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (data?.success === false) {
    throw new Error("Connection test failed. Please verify your Hotel ID and try again.");
  }
  return data;
};

/**
 * Step 2 — Fetch OTA room/rate codes + resolve group_id.
 * Returns { rooms: [...], group_id: "uuid" }
 * Codes inside rooms are integers — do not stringify them.
 * @param {object} params
 * @param {string} params.channel e.g. "booking"
 * @param {string} params.hotelId
 */
export const getChannelMappingDetails = async ({ channel, hotelId }) => {
  const { data, error } = await supabase.functions.invoke("getChannelMappingDetails", {
    body: { channel, hotel_id: hotelId },
  });
  if (error) throw new Error(await parseEdgeFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Step 3 — Create + activate the Channex channel and write to Supabase.
 * @param {object} params
 * @param {string} params.propertyId           Local Supabase property UUID
 * @param {string} params.channexPropertyId    Channex property UUID
 * @param {string} params.channel              e.g. "booking"
 * @param {string} params.hotelId              OTA hotel ID
 * @param {string} params.groupId              Channex group UUID (from step 2)
 * @param {Array}  params.ratePlanMappings     Array of mapping objects
 */
export const createChannelConnection = async ({
  propertyId,
  channexPropertyId,
  channel,
  hotelId,
  groupId,
  ratePlanMappings,
}) => {
  const { data, error } = await supabase.functions.invoke("createChannel", {
    body: {
      property_id:         propertyId,
      channex_property_id: channexPropertyId,
      channel,
      hotel_id:            hotelId,
      group_id:            groupId,
      rate_plan_mappings:  ratePlanMappings,
    },
  });
  if (error) throw new Error(await parseEdgeFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Disconnect — deactivates + deletes Channex channel, clears Supabase row.
 * @param {object} params
 * @param {string} params.propertyId
 * @param {string} params.channel
 */
export const disconnectChannelConnection = async ({ propertyId, channel }) => {
  const { data, error } = await supabase.functions.invoke("disconnectChannel", {
    body: { property_id: propertyId, channel },
  });
  if (error) throw new Error(await parseEdgeFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data;
};
