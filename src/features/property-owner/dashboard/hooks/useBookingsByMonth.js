import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useBookingsByMonth = (propertyId, month, year) => {
  return useQuery({
    queryKey: ["bookings-by-month", propertyId, month, year],
    queryFn: async () => {
      const startDate = new Date(year, month, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("property_id", propertyId)
        .gte("check_in", startDate)
        .lte("check_in", endDate);

      if (error) throw error;

      const byDate = {};
      (data || []).forEach((booking) => {
        const key = booking.check_in;
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push({
          id: booking.id,
          guestName: booking.guest_name,
          roomName: booking.room_name || "Room",
          platform: booking.platform,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          totalAmount: booking.total_amount,
          commissionAmount: booking.commission_amount,
          status: booking.sync_status,
        });
      });
      return byDate;
    },
    enabled: !!propertyId,
  });
};
