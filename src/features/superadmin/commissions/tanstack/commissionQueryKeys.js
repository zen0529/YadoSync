/**
 * TanStack Query key factory for superadmin commissions feature.
 */
export const commissionQueryKeys = {
  all: ["superadmin", "commissions"],
  properties: () => [...commissionQueryKeys.all, "properties"],
  propertyLedger: (propertyId) => [...commissionQueryKeys.all, "ledger", propertyId],
};
