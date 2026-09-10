import { Loader2 } from "lucide-react";

export const MappingLoadingState = ({ platformName, hotelId }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-green-500" />
      <div>
        <p className="text-sm font-medium text-foreground">
          Loading {platformName || "OTA"} inventory…
        </p>
        <p className="text-xs text-muted-foreground/50 mt-0.5">
          Fetching rooms and rate plans from Channex for Hotel ID:{" "}
          <span className="font-semibold text-foreground/70">
            {hotelId}
          </span>
        </p>
      </div>
    </div>
  );
};

export default MappingLoadingState;
