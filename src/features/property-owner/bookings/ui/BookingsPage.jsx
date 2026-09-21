import { useState } from "react";
import { TapeChart } from "../components/TapeChart";
import { AddBookingModal } from "../components/AddBookingModal";
import { useBookings } from "../hooks/useBookings";
import { AlertTriangle } from "lucide-react";

export const BookingsPage = () => {
  const [otaFilter, setOtaFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real data from Supabase — refreshes every 60 seconds
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useBookings();

  // Client-side filter by OTA
  const filtered = bookings.filter(
    (b) => otaFilter === "all" || b.ota_name === otaFilter,
  );

  // Bookings that need attention
  const pendingModCount = bookings.filter(
    (b) => b.status === "modified",
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Modified booking alert banner */}
      {pendingModCount > 0 && (
        <div className="glass-card rounded-xl px-4 py-3 text-xs flex items-center mb-4 border-amber-200/50 shrink-0">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {pendingModCount} booking{pendingModCount > 1 ? "s were" : " was"}{" "}
              modified by the OTA.
            </span>
          </div>
        </div>
      )}

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
    </div>
  );
};
