import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MappingEmptyState = ({ platformName, onNavigateToGeneral }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground/60">
        <SlidersHorizontal className="w-6 h-6" />
      </div>
      <div className="max-w-xs">
        <h3 className="text-sm font-semibold text-foreground">
          Hotel ID Required
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Please configure and test your {platformName || "OTA"} Hotel ID in
          the General Settings tab before mapping rooms and rates.
        </p>
      </div>
      {onNavigateToGeneral && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNavigateToGeneral}
          className="mt-2 text-xs"
        >
          Go to General Settings
        </Button>
      )}
    </div>
  );
};

export default MappingEmptyState;
