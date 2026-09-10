import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MappingErrorState = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 gap-3">
      <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-sm font-semibold text-foreground">
          Failed to Load Inventory
        </h3>
        <p className="text-xs text-muted-foreground/70 mt-1">{error}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs gap-1.5 mt-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Retry
        </Button>
      )}
    </div>
  );
};

export default MappingErrorState;
