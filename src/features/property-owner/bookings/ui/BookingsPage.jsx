import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TapeChart } from "../components/TapeChart";
import { AddBookingModal } from "../components/AddBookingModal";
import { ModifiedBookingDetailsModal } from "../components/ModifiedBookingDetailsModal";
import { useBookings } from "../hooks/useBookings";
import { useTapeChartInventory } from "../hooks/useTapeChartInventory";
import { useActiveProperty } from "@/features/property-owner/context/PropertyContext";

export const BookingsPage = () => {
  const { selectedPropertyId, isLoading: propertyLoading } = useActiveProperty();
  const otaFilter = "all";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Keep all owner bookings available for notification links; the calendar uses the active property.
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
  } = useBookings();
  const {
    data: inventory,
    isLoading: inventoryLoading,
    isError: inventoryError,
  } = useTapeChartInventory(selectedPropertyId);

  const isModifiedModalOpen = Boolean(location.state?.openModifiedBookingId || location.state?.openModifiedModal);
  const selectedModifiedBookingId = location.state?.openModifiedBookingId || null;

  // Client-side filter by OTA
  const filtered = bookings.filter(
    (b) => b.property_id === selectedPropertyId && (otaFilter === "all" || b.ota_name === otaFilter),
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      <div className="flex-1 min-h-0">
        {!selectedPropertyId && !propertyLoading ? (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">Select or create a property to view its bookings.</div>
        ) : propertyLoading || isLoading || inventoryLoading ? (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">Loading bookings calendar…</div>
        ) : isError || inventoryError ? (
          <div className="rounded-lg border border-destructive p-6 text-sm text-destructive">The bookings calendar could not be loaded. Please try again.</div>
        ) : (
          <TapeChart
            key={selectedPropertyId}
            bookings={filtered}
            roomTypes={inventory?.roomTypes ?? []}
            ratePlans={inventory?.ratePlans ?? []}
            onAddClick={() => setIsModalOpen(true)}
          />
        )}
      </div>

      <AddBookingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={() => refetch()}
      />

      <ModifiedBookingDetailsModal
        open={isModifiedModalOpen}
        onOpenChange={(open) => {
          if (!open) navigate(location.pathname, { replace: true, state: {} });
        }}
        bookings={bookings}
        selectedBookingId={selectedModifiedBookingId}
      />
    </div>
  );
};

