import { usePushRestrictions } from "@/features/property-owner/roomAndRates/hooks/usePushRestrictions";

/**
 * usePushRestrictionCell
 *
 * Wrapper around usePushRestrictions for single-cell or date-range restriction edits
 * from the inventory grid. Accepts major-unit rate values.
 */
export const usePushRestrictionCell = () => {
  const { pushRestrictions, loading, error } = usePushRestrictions();

  const pushRange = async ({
    propertyId,
    ratePlanId,
    channexPropertyId,
    channexRatePlanId,
    sellMode = "per_room",
    date,
    dates,
    rateMajor,
    minStayArrival = 1,
    minStayThrough = 1,
    maxStay = 0,
    stopSell = false,
    closedToArrival = false,
    closedToDeparture = false,
    values: explicitValues,
  }) => {
    const targetDates = dates && dates.length > 0 ? dates : (date ? [date] : []);
    if (!targetDates.length && !explicitValues?.length) {
      throw new Error("No valid dates provided for restriction update.");
    }

    const rateCents = Math.round(Number(rateMajor) * 100);
    const values = explicitValues || targetDates.map((d) => ({
      date: d,
      rate: rateCents,
      min_stay_arrival: Number(minStayArrival) || 1,
      min_stay_through: Number(minStayThrough) || 1,
      max_stay: Number(maxStay) || 0,
      stop_sell: Boolean(stopSell),
      closed_to_arrival: Boolean(closedToArrival),
      closed_to_departure: Boolean(closedToDeparture),
    }));

    return pushRestrictions({
      propertyId,
      ratePlanId,
      channexPropertyId,
      channexRatePlanId,
      sellMode,
      values,
    });
  };

  return { pushCell: pushRange, pushRange, loading, error };
};
