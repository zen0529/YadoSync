/**
 * Standard Query Key factory for the Inventory feature
 */
export const inventoryKeys = {
  all: ["inventory"],
  availabilities: (propertyId, year, month) => [
    "inventory",
    "availabilities",
    { propertyId, year, month },
  ],
  restrictions: (propertyId, year, month) => [
    "inventory",
    "restrictions",
    { propertyId, year, month },
  ],
};
