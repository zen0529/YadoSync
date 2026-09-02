/**
 * Standard Query Key factory for the Channels feature
 */
export const channelKeys = {
  all: ["channels"],
  myProperty: (userId) => ["channels", "property", userId],
  connections: (propertyId) => ["channels", "connections", propertyId],
  connectedCount: (userId) => ["channels", "connectedCount", userId],
};
