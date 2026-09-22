import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TapeChart } from "../components/TapeChart";
import { AddBookingModal } from "../components/AddBookingModal";
import { ModifiedBookingDetailsModal } from "../components/ModifiedBookingDetailsModal";
import { useBookings } from "../hooks/useBookings";

export const BookingsPage = () => {
  const [otaFilter, setOtaFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModifiedModalOpen, setIsModifiedModalOpen] = useState(false);
  const [selectedModifiedBookingId, setSelectedModifiedBookingId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Real data from Supabase — refreshes every 60 seconds
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useBookings();

  // Automatically open the modified booking details modal when navigating from a notification
  useEffect(() => {
    if (location.state?.openModifiedBookingId || location.state?.openModifiedModal) {
      setSelectedModifiedBookingId(location.state?.openModifiedBookingId || null);
      setIsModifiedModalOpen(true);
      // Clear location state so refreshing or subsequent navigation doesn't re-trigger the modal
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Client-side filter by OTA
  const filtered = bookings.filter(
    (b) => otaFilter === "all" || b.ota_name === otaFilter,
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        <TapeChart
          bookings={filtered}
          selectedResort="all"
          selectedPlatform={otaFilter}
          onAddClick={() => setIsModalOpen(true)}
        />
      </div>

      <AddBookingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={() => refetch()}
      />

      <ModifiedBookingDetailsModal
        open={isModifiedModalOpen}
        onOpenChange={(open) => {
          setIsModifiedModalOpen(open);
          if (!open) setSelectedModifiedBookingId(null);
        }}
        bookings={bookings}
        selectedBookingId={selectedModifiedBookingId}
      />
    </div>
  );
};

