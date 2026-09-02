import { supabase } from "@/lib/supabase";

/**
 * Step 1 — Test OTA credentials against Channex.
 * @param {object} params
 * @param {string} params.channel   e.g. "booking"
 * @param {string} [params.platform] Backward-compatible platform key
 * @param {string} params.hotelId   OTA property/hotel ID (e.g. Booking.com extranet ID)
 */
export const testChannelConnection = async ({ channel, platform, hotelId }) => {
  const { data, error } = await supabase.functions.invoke("testChannelConnection", {
    body: { channel: channel || platform, hotel_id: hotelId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Step 2 — Fetch OTA room/rate codes + resolve group_id.
 * Returns { rooms: [...], group_id: "uuid" }
 * Codes inside rooms are integers — do not stringify them.
 * @param {object} params
 * @param {string} [params.channel] e.g. "booking"
 * @param {string} [params.platform]
 * @param {string} params.hotelId
 */
export const getChannelMappingDetails = async ({ channel, platform, hotelId }) => {
  const { data, error } = await supabase.functions.invoke("getChannelMappingDetails", {
    body: { platform: channel || platform, hotel_id: hotelId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Step 3 — Create + activate the Channex channel and write to Supabase.
 * @param {object} params
 * @param {string} params.propertyId           Local Supabase property UUID
 * @param {string} params.channexPropertyId    Channex property UUID
 * @param {string} [params.channel]            e.g. "booking"
 * @param {string} [params.platform]           Backward-compatible alias
 * @param {string} params.hotelId              OTA hotel ID
 * @param {string} params.groupId              Channex group UUID (from step 2)
 * @param {Array}  params.ratePlanMappings     Array of mapping objects
 */
export const createChannelConnection = async ({
  propertyId,
  channexPropertyId,
  channel,
  platform,
  hotelId,
  groupId,
  ratePlanMappings,
}) => {
  const { data, error } = await supabase.functions.invoke("createChannel", {
    body: {
      property_id:         propertyId,
      channex_property_id: channexPropertyId,
      platform:            channel || platform,
      hotel_id:            hotelId,
      group_id:            groupId,
      rate_plan_mappings:  ratePlanMappings,
    },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Disconnect — deactivates + deletes Channex channel, clears Supabase row.
 * @param {object} params
 * @param {string} params.propertyId
 * @param {string} [params.channel]
 * @param {string} [params.platform]
 */
export const disconnectChannelConnection = async ({ propertyId, channel, platform }) => {
  const { data, error } = await supabase.functions.invoke("disconnectChannel", {
    body: { property_id: propertyId, platform: channel || platform },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};
