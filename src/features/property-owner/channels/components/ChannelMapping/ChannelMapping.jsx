import { useChannelMapping } from "../../hooks/useChannelMapping";
import { filterAvailableRoomTypes } from "../../utils/mappingUtils";
import MappingEmptyState from "./MappingEmptyState";
import MappingLoadingState from "./MappingLoadingState";
import MappingErrorState from "./MappingErrorState";
import MappingHeader from "./MappingHeader";
import RoomMappingCard from "./RoomMappingCard";
import MappingFooter from "./MappingFooter";

/**
 * Channel Mapping Component
 *
 * Presentation component orchestrating the mapping workflow via useChannelMapping.
 * Adheres to SRP by delegating state/data logic to hooks and sub-views to focused components.
 */
const ChannelMapping = ({
  platform,
  property,
  hotelId,
  connection,
  onNavigateToGeneral,
  onSave,
  onSuccess,
}) => {
  const {
    effectiveHotelId,
    loadingDetails,
    loadingLocalInventory,
    loadError,
    otaRooms,
    roomMappings,
    rateMappings,
    roomTypes,
    ratePlans,
    allOtaRates,
    mappedRatesCount,
    allRatesMapped,
    saving,
    saveSuccess,
    saveError,
    fetchMapping,
    handleRoomTypeSelect,
    handleRateSelect,
    handleSave,
  } = useChannelMapping({
    platform,
    property,
    hotelId,
    connection,
    onSave,
    onSuccess,
  });

  // 1. Empty State: No Hotel ID configured
  if (!effectiveHotelId) {
    return (
      <MappingEmptyState
        platformName={platform?.name}
        onNavigateToGeneral={onNavigateToGeneral}
      />
    );
  }

  // 2. Loading State: Live Spinner
  if (loadingDetails || loadingLocalInventory) {
    return (
      <MappingLoadingState
        platformName={platform?.name}
        hotelId={effectiveHotelId}
      />
    );
  }

  // 3. Error State
  if (loadError) {
    return (
      <MappingErrorState
        error={loadError}
        onRetry={fetchMapping}
      />
    );
  }

  // 4. Main Mapping View
  return (
    <div className="flex flex-col h-full">
      <MappingHeader platformName={platform?.name} />

      {/* Scrollable list of OTA rooms and rates */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {otaRooms.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground/60">
            No rooms found for this hotel on {platform?.name}.
          </div>
        ) : (
          otaRooms.map((room) => {
            const selectedRoomTypeId = roomMappings[room.room_code] || "";
            const availableRoomTypes = filterAvailableRoomTypes(
              roomTypes,
              roomMappings,
              room.room_code
            );

            return (
              <RoomMappingCard
                key={room.room_code}
                room={room}
                selectedRoomTypeId={selectedRoomTypeId}
                availableRoomTypes={availableRoomTypes}
                ratePlans={ratePlans}
                rateMappings={rateMappings}
                onRoomTypeSelect={handleRoomTypeSelect}
                onRateSelect={handleRateSelect}
              />
            );
          })
        )}
      </div>

      {/* Footer action bar */}
      <MappingFooter
        saving={saving}
        saveSuccess={saveSuccess}
        saveError={saveError}
        allRatesMapped={allRatesMapped}
        mappedRatesCount={mappedRatesCount}
        totalRatesCount={allOtaRates.length}
        onSave={handleSave}
      />
    </div>
  );
};

export default ChannelMapping;
