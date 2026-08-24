import { supabase } from "@/lib/supabase";

/** Fetch the current user's property (id + channex_property_id) */
export const getMyProperty = async (userId) => {
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, channex_property_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/** Fetch all platform connections for a property */
export const getConnections = async (propertyId) => {
  const { data, error } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("property_id", propertyId);
  if (error) throw error;
  return data || [];
};

/** Get count of connected platforms for a user (used by sidebar badge) */
export const getConnectedCount = async (userId) => {
  const { data: prop } = await supabase
    .from("properties")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!prop) return 0;

  const { count } = await supabase
    .from("platform_connections")
    .select("id", { count: "exact", head: true })
    .eq("property_id", prop.id)
    .eq("connection_status", "connected");
  return count || 0;
};

// ── Channex Channel API calls (via Edge Functions) ──────────────────────────

const edgeFn = async (name, body) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke(name, { body });
  if (res.error) throw new Error(res.error.message);
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
};

/**
 * Step 1 — Test OTA credentials against Channex.
 * @param {string} platform  e.g. "booking"
 * @param {string} hotelId   OTA property/hotel ID (e.g. Booking.com extranet ID)
 */
export const testChannelConnection = async ({ platform, hotelId }) =>
  edgeFn("testChannelConnection", { platform, hotel_id: hotelId });

/**
 * Step 2 — Fetch OTA room/rate codes + resolve group_id.
 * Returns { rooms: [...], group_id: "uuid" }
 * Codes inside rooms are integers — do not stringify them.
 * @param {string} platform
 * @param {string} hotelId
 */
export const getChannelMappingDetails = async ({ platform, hotelId }) =>
  edgeFn("getChannelMappingDetails", { platform, hotel_id: hotelId });

/**
 * Step 3 — Create + activate the Channex channel and write to Supabase.
 * @param {object} params
 * @param {string} params.propertyId           Local Supabase property UUID
 * @param {string} params.channexPropertyId    Channex property UUID
 * @param {string} params.platform             e.g. "booking"
 * @param {string} params.hotelId              OTA hotel ID
 * @param {string} params.groupId              Channex group UUID (from step 2)
 * @param {Array}  params.ratePlanMappings     Array of mapping objects
 */
export const createChannelConnection = async ({
  propertyId,
  channexPropertyId,
  platform,
  hotelId,
  groupId,
  ratePlanMappings,
}) =>
  edgeFn("createChannel", {
    property_id:         propertyId,
    channex_property_id: channexPropertyId,
    platform,
    hotel_id:            hotelId,
    group_id:            groupId,
    rate_plan_mappings:  ratePlanMappings,
  });

/**
 * Disconnect — deactivates + deletes Channex channel, clears Supabase row.
 * @param {string} propertyId
 * @param {string} platform
 */
export const disconnectChannelConnection = async ({ propertyId, platform }) =>
  edgeFn("disconnectChannel", { property_id: propertyId, platform });
